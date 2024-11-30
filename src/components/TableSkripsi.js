import {
  CSmartTable,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CLoadingButton,
} from '@coreui/react-pro';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // Import SweetAlert
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function TableSkripsi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [columnFilter, setColumnFilter] = useState({});
  const [columnSorter, setColumnSorter] = useState(null);
  const [records, setRecords] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for loading button

  const fetchData = async () => {
    try {
      const offset = itemsPerPage * (activePage - 1);
      let params = new URLSearchParams();
      Object.keys(columnFilter).forEach((key) => {
        params.append(key, columnFilter[key]);
      });
      if (columnSorter) {
        params.append('sort', `${columnSorter.column}%${columnSorter.state}`);
      }

      const response = await fetch(
        `https://sdgstelkomuniversity.id/model/get-hasil-akhir?page=${activePage}&per_page=${itemsPerPage}&${params.toString()}`,
      );
      const result = await response.json();
      console.log(response.url);

      setData(result.data || []);
      setRecords(result.total_items || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activePage, itemsPerPage, columnFilter, columnSorter]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      MySwal.fire('Invalid file type!', 'Please upload a PDF file.', 'error'); // SweetAlert for invalid file type
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      MySwal.fire('No file selected!', 'Please select a PDF file.', 'warning'); // SweetAlert for no file
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    setIsSubmitting(true); // Start loading

    try {
      const response = await axios.post('http://127.0.0.1:3900/model/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('File uploaded successfully', response.data);

      MySwal.fire({
        title: 'Success!',
        text: 'File uploaded successfully!',
        icon: 'success',
      }).then(() => {
        // Show toast notification after upload is confirmed
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'File upload complete',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          },
        });
      });

      setVisible(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      MySwal.fire('Upload Failed', 'Failed to upload file. Please try again.', 'error'); // SweetAlert for upload error
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  const columns = [
    { key: 'Judul', _style: { width: '25%' } },
    { key: 'Penulis', _style: { width: '25%' } },
    { key: 'sdgs_images', label: 'Pemetaan SDGS', _style: { width: '25%' } },
    { key: 'Tahun', _style: { width: '25%' } },
    { key: 'Source', _style: { width: '25%' } },
  ];

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <CButton color="primary" onClick={() => setVisible(true)}>
        Upload File
      </CButton>

      <CModal
        visible={visible}
        onClose={() => setVisible(false)}
        aria-labelledby="LiveDemoExampleLabel"
      >
        <CModalHeader>
          <CModalTitle id="LiveDemoExampleLabel">Upload File</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <input type="file" onChange={handleFileChange} accept="application/pdf" />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Close
          </CButton>
          <CLoadingButton color="primary" onClick={handleSubmit} loading={isSubmitting}>
            Submit
          </CLoadingButton>
        </CModalFooter>
      </CModal>

      <div style={{ position: 'relative', overflow: 'auto', height: 'calc(100vh - 100px)' }}>
        {loading && <p>Loading...</p>}
        <CSmartTable
          columns={columns}
          items={data}
          columnFilter
          columnSorter
          itemsPerPage={itemsPerPage}
          itemsPerPageSelect
          loading={loading}
          itemsPerPageOptions={[10, 50, 100]}
          pagination={{ external: true }}
          paginationProps={{
            activePage,
            pages: itemsPerPage === 0 ? 1 : Math.ceil(records / itemsPerPage),
          }}
          tableProps={{
            hover: true,
            responsive: false,
            style: { position: 'relative' },
          }}
          onActivePageChange={(page) => {
            setLoading(true);
            setActivePage(page);
          }}
          onColumnFilterChange={(filter) => {
            setActivePage(1);
            setLoading(true);
            setColumnFilter(filter);
          }}
          onItemsPerPageChange={(perPage) => {
            setLoading(true);
            setActivePage(1);
            setItemsPerPage(perPage);
          }}
          tableHeadProps={{
            style: {
              position: 'sticky',
              top: 0,
              backgroundColor: '#f8d7da',
              zIndex: 1,
            },
          }}
          onSorterChange={setColumnSorter}
          scopedColumns={{
            sdgs_images: (item) => (
              <td className="py-2">
                {item.sdgs_images && item.sdgs_images.length > 0 ? (
                  item.sdgs_images.map((imgUrl, index) => (
                    <img
                      key={index}
                      src={`https://sdgstelkomuniversity.id/${imgUrl}`}
                      alt={`SDG ${item.sdgs_images[index]}`}
                      style={{ width: '50px', height: '50px', margin: '0 5px 10px 5px' }}
                    />
                  ))
                ) : (
                  <p>No images</p>
                )}
              </td>
            ),
            show_details: (item) => (
              <td className="py-2">
                <CButton
                  color="primary"
                  variant="outline"
                  shape="square"
                  size="sm"
                  onClick={() => {
                    navigate(`/dosen/${itemsPerPage}/${activePage}/${item.id}`);
                  }}
                >
                  Lihat
                </CButton>
              </td>
            ),
          }}
        />
      </div>
    </>
  );
}

export default TableSkripsi;
