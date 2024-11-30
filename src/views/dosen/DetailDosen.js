import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CCard, CCardBody, CSmartTable, CButton, CProgress, CProgressBar } from '@coreui/react-pro'
import { CChartDoughnut } from '@coreui/react-chartjs'

// Create a cache object
const dataCache = new Map()

function DetailDosen() {
  const { per_page, pages, nip } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState({ datasets: [] })
  const [showChart, setShowChart] = useState(false)
  const [progress, setProgress] = useState(0) // For progress indication
  const [showAll, setShowAll] = useState(false) // Flag to indicate "Show All" mode

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setProgress(0) // Reset progress

      // Create a unique cache key based on query parameters
      const cacheKey = `${per_page}-${pages}-${nip}-${showAll}`

      // Check if data is already in the cache
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey)
        setData(cachedData.data)
        setChartData(cachedData.chartData)
        setShowChart(cachedData.showChart)
        setLoading(false)
        return
      }

      try {
        let params = new URLSearchParams()
        params.append('per_page', per_page)
        params.append('page', pages)
        params.append('nip', nip)

        const perPageQuery = showAll
          ? `per_page=${data.total_records || 0}` // Fetch all records
          : `per_page=${per_page}&page=${pages}`

        // Simulate progress updates
        const interval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 20, 80)) // Increment progress
        }, 200)

        const response = await axios.get(
          `https://sdgstelkomuniversity.id/model/detail_dosen?${perPageQuery}&${params.toString()}`
        )

        clearInterval(interval) // Clear interval when data is fetched
        setProgress(100) // Set progress to complete

        const sdgsCounts = response.data.sdgs_counts

        // Filter SDGs that have values
        const filteredKeys = Object.keys(sdgsCounts).filter(
          (key) => sdgsCounts[key] !== 0 && sdgsCounts[key] !== null,
        )

        if (filteredKeys.length > 0) {
          const sortedKeys = filteredKeys.sort((a, b) => {
            return parseInt(a.replace('SDGS', '')) - parseInt(b.replace('SDGS', ''))
          })

          const sortedLabels = sortedKeys.map((key) => `SDGS ${key.replace('SDGS', '')}`)
          const sortedValues = sortedKeys.map((key) => sdgsCounts[key])

          const backgroundColors = [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#FF9F40',
            '#FFCD56',
            '#4BC0C0',
            '#36A2EB',
            '#FF6384',
            '#FFCE56',
            '#F1C40F',
            '#E67E22',
            '#2ECC71',
            '#1F77B4',
            '#D62728',
            '#9467BD',
            '#8C564B',
            '#E377C2',
            '#7F7F7F',
            '#BCBD22',
          ]

          const colors = backgroundColors.slice(0, sortedLabels.length)
          setChartData({
            labels: sortedLabels,
            datasets: [
              {
                data: sortedValues,
                backgroundColor: colors,
                borderWidth: 1,
              },
            ],
          })

          setShowChart(true)
        } else {
          setShowChart(false)
        }

        // Store the data in the cache
        dataCache.set(cacheKey, {
          data: response.data,
          chartData: chartData,
          showChart: showChart,
        })

        setData(response.data)
      } catch (error) {
        setError(error.message)
        setData(null)
      } finally {
        setLoading(false)
        setTimeout(() => setProgress(0), 500) // Hide progress after a short delay
      }
    }

    fetchData()
  }, [per_page, pages, nip, showAll])

 
  if (loading) return (
    <div>
      <p>Loading...</p>
      <CProgress className="mb-3">
        <CProgressBar value={progress}>{progress}%</CProgressBar>
      </CProgress>
    </div>
  )
  if (error) return <p>Error: {error}</p>

  const columns = [
    { key: 'Judul', label: 'Judul', _style: { width: '40%' } },
    { key: 'Penulis', _style: { width: '30%' } },
    { key: 'sdgs_images', _style: { width: '25%' }, sorter: true },
    { key: 'Source', label: 'Source', _style: { width: '25%' } },
    { key: 'Tahun', _style: { width: '10%' }, },
  ]

  return (
    <div>
      <CCard className="mb-5">
        <CCardBody>
          <div className="row">
            <div className="col-lg-6">
              <table className="table" style={{ width: '100%', borderSpacing: '8px 5px' }}>
                <tbody>
                  <tr>
                    <td>Nama</td>
                    <td>:</td>
                    <td>{data.nama_lengkap || 'No Data'}</td>
                  </tr>
                  <tr>
                    <td>NIDN</td>
                    <td>:</td>
                    <td>{data.nidn || 'No Data'}</td>
                  </tr>
                  <tr>
                    <td>Lokasi Kerja</td>
                    <td>:</td>
                    <td>{data.lokasi_kerja || 'No Data'}</td>
                  </tr>
                  <tr>
                    <td>Jenis Kelamin</td>
                    <td>:</td>
                    <td>{data.jenis_kelamin || 'No Data'}</td>
                  </tr>
                  <tr>
                    <td>Jabatan Struktural</td>
                    <td>:</td>
                    <td>{data.jabatan_struktural || 'No Data'}</td>
                  </tr>
                  <tr>
                    <td>Kode Dosen</td>
                    <td>:</td>
                    <td>{data.kode_dosen || 'No Data'}</td>
                  </tr>
                  <tr>
                    <td>Status Pegawai</td>
                    <td>:</td>
                    <td>{data.status_pegawai || 'No Data'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-lg-6">
              {showChart && (
                <CChartDoughnut
                  options={{
                    responsive: true,
                    aspectRatio: 1.0,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                  height={450}
                  data={chartData}
                />
              )}
            </div>
          </div>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <div className="row mt-4">
            <div className="col-12">
              <CSmartTable
                activePage={1}
                cleaner
                clickableRows
                columns={columns}
                columnFilter
                items={data.publications || []}
                itemsPerPage={5}
                pagination
                tableFilter
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
                }}
                tableProps={{
                  hover: true,
                  responsive: true
                }}
              />
            </div>
          </div>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default DetailDosen
