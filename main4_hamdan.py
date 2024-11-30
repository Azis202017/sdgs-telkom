from flask import Flask, jsonify, request,url_for
from flask_cors import CORS
import pandas as pd
import re
import json
import datetime
import os
from transformers import pipeline, AutoTokenizer
from oplib.main import run_oplib_main
from oplib.oplib2 import OpenLibrary
from oplib.preprocessOplib import PreprocessLibrary
from sinta.preprocessSinta import SintaPreprocessor
import fitz
app = Flask(__name__, static_url_path='/static')
CORS(app)

def clean_phone_number(phone):
    if pd.isna(phone):
        return ''
    cleaned_phone = re.sub(r'\D', '', phone)
    return cleaned_phone[:10] if len(cleaned_phone) > 10 else cleaned_phone

def select_single_email(email):
    if pd.isna(email):
        return None
    return re.split(r'[;,#]', email)[0].strip()
def get_publications_for_dosen(nama_lengkap, publications):
    print(f"Searching publications for: {nama_lengkap}")  # Debugging line
    matching_publications = [pub for pub in publications if nama_lengkap.lower() in pub.get('Penulis', '').lower()]
    print(f"Found {len(matching_publications)} publications")  # Debugging line
    return matching_publications
def get_sdg_image_url(labels):
    if labels is None:
        return []
    if not isinstance(labels, list):
        return []
    return [f'/static/images/{label}.png' for label in labels]
def read_csv_to_json(page=0, page_size=10):
    try:
        print("Reading CSV file...")
        df = pd.read_csv('DataDosen.csv', delimiter=';', on_bad_lines='skip')

        # Clean data
        df['NO HP'] = df['NO HP'].apply(clean_phone_number)
        df['EMAIL'] = df['EMAIL'].apply(select_single_email)
        df.fillna('', inplace=True)

        print("Data cleaning completed.")
        print("Loading publications JSON file...")

        with open('hasil_akhir.json', 'r', encoding='utf-8') as f:
            publications = json.load(f)

        print("Publications JSON loaded.")

        # Implement pagination
        start_idx = page * page_size
        end_idx = start_idx + page_size
        df_page = df.iloc[start_idx:end_idx]

        results = []
        for _, row in df_page.iterrows():
            fronttitle = row['FRONTTITLE']
            backtitle = row['BACKTITLE']
            nama_lengkap = row['NAMA LENGKAP']

            # Combine names while skipping empty values
            combined_name = ' '.join(filter(None, [fronttitle, nama_lengkap, backtitle])).strip()

            publications_for_dosen = get_publications_for_dosen(nama_lengkap, publications)
            for pub in publications_for_dosen:
                pub['sdgs_images'] = get_sdg_image_url(pub.get('Sdgs', []))

            dosen_data = {
                'no': row.get('NO', None),
                'id': row.get('NIP', None),
                'fronttitle': fronttitle,
                'nama_lengkap': combined_name,
                'backtitle': backtitle,
                'jenis_kelamin': row.get('JENIS KELAMIN', ''),
                'kode_dosen': row.get('KODE DOSEN', ''),
                'nidn': row.get('NIDN', ''),
                'status_pegawai': row.get('STATUS PEGAWAI', ''),

                'jafung': row.get('JAFUNG', ''),
                'lokasi_kerja': row.get('LOKASI KERJA', ''),
                'jabatan_struktural': row.get('JABATAN STRUKTURAL', ''),
                'email': row.get('EMAIL', ''),
                'no_hp': row.get('NO HP', ''),
                'lokasi_kerja_sotk': row.get('LOKASI KERJA SOTK', ''),
                'publications': publications_for_dosen,
                'total_publications': len(publications_for_dosen)
            }
            results.append(dosen_data)

        print("Data processing completed.")
        return {
            'page': page,
            'page_size': page_size,
            'total_pages': (len(df) + page_size - 1) // page_size,
            'total_records': len(df),
            'total_records_per_page': len(df_page),
            'data': results
        }

    except FileNotFoundError as e:
        print(f"File not found: {e}")
        return {'error': 'File not found'}, 404
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON file: {e}")
        return {'error': 'Error decoding JSON file'}, 400
    except Exception as e:
        print(f"An error occurred: {e}")
        return {'error': str(e)}, 500

@app.route('/data_dosen', methods=['GET'])
def get_data():
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 0))  # Start from 0
        per_page = int(request.args.get('per_page', 10))

        # Fetch paginated data
        data = read_csv_to_json(page=page, page_size=per_page)

        # Check if data contains an error
        if isinstance(data, dict) and 'error' in data:
            return jsonify(data), 400

        response = {
            'page': data['page'],
            'per_page': data['page_size'],
            'total_pages': data['total_pages'],
            'total_records': data['total_records'],
            'total_records_per_page': data['total_records_per_page'],
            'data_dosen': data['data']
        }

        return jsonify(response)

    except ValueError as e:
        return jsonify({'error': 'Invalid parameters', 'details': str(e)}), 400

@app.route('/data_dosen/<int:page>/<string:nip>', methods=['GET'])
def get_data_by_nip(page, nip):
    try:
        data = read_csv_to_json(page=page)

        # Periksa jika data berisi error
        if isinstance(data, dict) and 'error' in data:
            return jsonify(data), 400

        # Cari dosen berdasarkan 'nip'
        dosen = next((d for d in data['data'] if d['id'] == nip), None)

        if dosen:
            # Memuat file hasil akhir untuk pemetaan SDGs
            with open('hasil_akhir.json', 'r', encoding='utf-8') as f:
                hasil_akhir = json.load(f)
            #print(dosen['publications'])  
            # Cari pemetaan SDGs untuk dosen
            # sdgs_pemetaan = [item for item in hasil_akhir if dosen['nama_lengkap'].lower() in item.get('Penulis', '').lower()]
            # print(sdgs_pemetaan)
            # # Hitung jumlah SDGs yang terdaftar
            sdgs_counts = {f"SDG{i}": 0 for i in range(1, 18)}
            for publikasi in dosen['publications']:
                for sdg in publikasi.get('Sdgs', []):
                    if sdg in sdgs_counts:
                        sdgs_counts[sdg] += 1

         
            dosen['sdgs_pemetaan'] = []
            dosen['sdgs_counts'] = sdgs_counts

            return jsonify(dosen)
        else:
            return jsonify({'error': 'Dosen not found'}), 404

    except ValueError as e:
        return jsonify({'error': 'Invalid nip parameter', 'details': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-hasil-akhir', methods=['GET'])
def get_hasil_akhir():
    try:
        hasil_akhir_path = 'hasil_akhir.json'

        # Check if the file exists
        if not os.path.exists(hasil_akhir_path):
            return jsonify({"error": "File not found"}), 404

        with open(hasil_akhir_path, 'r') as file:
            data = json.load(file)

        if data is None or not isinstance(data, list):
            return jsonify({"error": "Invalid data format in JSON file"}), 500

        def get_sdg_image_url(labels):
            if labels is None:
                return []
            if not isinstance(labels, list):
                return []
            return [url_for('static', filename=f'images/{label}.png') for label in labels]

        for item in data:
            if 'Sdgs' in item:
                item['sdgs_images'] = get_sdg_image_url(item['Sdgs'])
            else:
                item['sdgs_images'] = []

        # Pagination
        page = int(request.args.get('page', 0))  # Start page from 0
        per_page = int(request.args.get('per_page', 10))

        start = page * per_page
        end = start + per_page

        paginated_data = data[start:end]
        total_items = len(data)
        total_pages = (total_items + per_page - 1) // per_page

        response = {
            'page': page,
            'per_page': per_page,
            'total_items': total_items,
            'total_pages': total_pages,
            'data': paginated_data
        }

        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-data-oplib', methods=['GET'])
def get_data_oplib():
    # Create an instance of the OpenLibrary class
    ol = OpenLibrary()

    # Define the search options based on the request or default values
    search_options = {
        'type': request.args.get('type', '4'),  # Default to SKRIPSI if not provided
        'start_date': request.args.get('start_date', '2022-01-01'),
        'end_date': request.args.get('end_date', '2022-12-31'),
        # Add other search options as needed
    }

    # Get the data from the Open Library
    content = ol.get_all_data_from_range_date(**search_options)

    # Parse the results
    parsed_results = list(ol.parse_results(content))

    # Return the results as a JSON response
    return jsonify(parsed_results)

@app.route('/post-data-sinta', methods=['POST'])
def upload_file_sinta():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    # Save file and process
    current_date = datetime.date.today()
    file_path = f"./sinta/storage/result/scrappingSinta{current_date.day}-{current_date.month}-{current_date.year}.csv"
    file.save(file_path)
    preprocessor = SintaPreprocessor(file_path)
    processed_df = preprocessor.preprocess()
    file_result = f'preProcessSinta{current_date.day}-{current_date.month}-{current_date.year}'
    preprocessor.save_result_main(file_result)
        
    # Classification
    def truncate_text(text, tokenizer, max_length=512):
        tokens = tokenizer(text, truncation=True, max_length=max_length, return_tensors='pt')
        return tokenizer.decode(tokens['input_ids'][0], skip_special_tokens=True)

    def classify_sdgs(text):
        truncated_text = truncate_text(text, tokenizer)
        results = classifier(truncated_text)
        labels = [result['label'] for result in results[0] if result['score'] > 0.5]
        return labels if labels else None
    
    df_final = pd.read_json(f'./sinta/storage/result/preprocessSinta/{file_result}.json')
    classifier = pipeline("text-classification", model="Zaniiiii/sdgs", return_all_scores=True)
    tokenizer = AutoTokenizer.from_pretrained("Zaniiiii/sdgs")
    df_final['Sdgs'] = df_final['Abstrak'].apply(classify_sdgs)
    df_final["Source"] = "Sinta"
    df = pd.read_json("./hasil_akhir.json")
    df = pd.concat([df, df_final]).drop_duplicates(subset=['Judul'])
    df.to_json("./hasil_akhir.json", orient='records')
    return "Data Sinta added"

@app.route('/post-data-oplib', methods=['POST'])
def post_data_oplib():
    try:
        run_oplib_main()
        return jsonify({'message': 'Oplib processing completed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    # Simpan file dan lakukan ekstraksi
    file_path = f"./upload/{file.filename}"
    file.save(file_path)
    extracted_data = extract_pdf_data_pymupdf(file_path)
    df = pd.DataFrame([extracted_data])
    file_result = file_path[:-4] +".csv"
    file_end = file.filename[:-4]
    df.to_csv(file_result)
    preprocessor = SintaPreprocessor(file_result)
    processed_df = preprocessor.preprocess()
    preprocessor.save_result2(file_end)

    def truncate_text(text, tokenizer, max_length=512):
        tokens = tokenizer(text, truncation=True, max_length=max_length, return_tensors='pt')
        return tokenizer.decode(tokens['input_ids'][0], skip_special_tokens=True)

    def classify_sdgs(text):
        truncated_text = truncate_text(text, tokenizer)
        results = classifier(truncated_text)
        labels = [result['label'] for result in results[0] if result['score'] > 0.5]
        return labels if labels else None
    
    #klasifikasi
    df_final = pd.read_json(f'./upload/{file_end}.json')
    print(df_final.info())
    df = pd.read_json("./hasil_akhir.json")
    classifier = pipeline("text-classification", model="Zaniiiii/sdgs", return_all_scores=True)

    tokenizer = AutoTokenizer.from_pretrained("Zaniiiii/sdgs")
    df_final['Sdgs'] = df_final['Abstrak'].apply(classify_sdgs)
    df_final["Source"] = "Upload"
    print(df_final.info())
    print(df.info())
    df = pd.concat([df, df_final])
    df = df.drop_duplicates(subset=['Judul'])
    df.to_json("./hasil_akhir.json",orient='records')
    print(df.info())
    
    return jsonify(extracted_data)

UPLOAD_FOLDER = '/file'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def extract_pdf_data_pymupdf(pdf_path):
    # Membuka file PDF

    doc = fitz.open(pdf_path)
    text = ""
    
    # Ekstrak teks dari semua halaman
    for page in doc:
        text += page.get_text()

    # Ekstrak teks dari halaman pertama saja
    first_page_text = doc[0].get_text()

    # Regex untuk menangkap judul setelah "homepage: www.GrowingScience.com/ijds"
    title_match = re.search(r'homepage: www\.GrowingScience\.com/ijds\s+(.+?)\s+\n', first_page_text, re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()
        # Menghapus karakter newline yang berlebihan
        title = re.sub(r'\n+', ' ', title).strip()
    else:
        title = "Not found"

    # Regex untuk menangkap abstrak
    abstract_match = re.search(r'A B S T R A C T(.+)', text, re.DOTALL)

    if abstract_match:
        abstract = abstract_match.group(1).strip()
        
        # Ambil semua teks setelah "Accepted:"
        accepted_match = re.search(r'Accepted:.*?\n(.*)', abstract, re.DOTALL)
        if accepted_match:
            # Ambil teks setelah "Accepted:"
            abstract_cleaned = accepted_match.group(1).strip()
            
            # Hapus semua teks setelah "\n©"
            abstract_cleaned = re.sub(r'\n©.*', '', abstract_cleaned, flags=re.DOTALL).strip()
            
            # Hapus semua teks sebelum "\n\n" (dua baris kosong)
            abstract_cleaned = re.sub(r'^.*?\n \n', '', abstract_cleaned, flags=re.DOTALL).strip()
        else:
            abstract_cleaned = "Not found"
    else:
        abstract_cleaned = "Not found"

    # Menghapus semua karakter newline (\n)
    abstract_cleaned = re.sub(r'\n+', ' ', abstract_cleaned).strip()

    accepted_date_match = re.search(r'Accepted: .*?(\d{4})', text)
    if accepted_date_match:
        accepted_date = int(accepted_date_match.group(1))
    else:
        accepted_date = "Not found"

    authors_match = re.search(r'www\.GrowingScience\.com/ijds\s+\n(.+?)\na', first_page_text, re.DOTALL)
    if authors_match:
        print("1")
        authors = authors_match.group(1).strip()
        
        # Hapus bagian "www.GrowingScience.com/ijds \n \n \n \n \n \n \n"
        authors = re.sub(r'www\.GrowingScience\.com/ijds\s', '', authors, flags=re.DOTALL).strip()

        # Hapus semua teks sebelum "\n \n \n \n"
        authors = re.sub(r'^.*?\n \n', '', authors, flags=re.DOTALL).strip()

        # Hapus semua karakter "*"
        authors = authors.replace('*', '').strip()

        # Hapus satu karakter sebelum setiap koma
        authors = re.sub(r'\s,', ',', authors)
    else:
        authors = "Not found"

    authors = re.sub(r'\n+', ' ', authors).strip()

    # Ubah "and" menjadi ","
    authors = authors.replace(" and ", ", ")

    # Hapus satu karakter sebelum setiap koma
    authors = re.sub(r'.(?=,)', '', authors)

    # Hapus satu karakter terakhir
    authors = authors[:-1]

    data = {
        "Title": title,
        "Abstract": abstract_cleaned,
        "Year": accepted_date if isinstance(accepted_date, int) else "Not found",
        "Authors": authors,
        # "first_page_text": first_page_text.strip()  # Teks dari halaman pertama saja
    }

    return data
@app.route('/get-sdgs-count', methods=['GET'])
def get_sdgs_count():
    # Path to your JSON file
    hasil_akhir_path = 'hasil_akhir.json'

    # Read the JSON data
    with open(hasil_akhir_path, 'r') as file:
        data = json.load(file)

    # Initialize a dictionary to count occurrences of each SDG
    sdgs_count = {f'SDGS{i}': 0 for i in range(1, 18)}

    # Iterate through the data and count SDGs
    for item in data:
        if 'Sdgs' in item and isinstance(item['Sdgs'], list):
            for sdg in item['Sdgs']:
                if sdg in sdgs_count:
                    sdgs_count[sdg] += 1

    # Return the SDGs count as a JSON response
    return jsonify(sdgs_count)
if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=True)
