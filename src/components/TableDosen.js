import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { debounce } from 'lodash'
import { CSmartTable, CButton, CProgress, CProgressBar } from '@coreui/react-pro'

// Create a cache object
const dataCache = new Map()

function TableDosen() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0) // For progress indication
  const [activePage, setActivePage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [columnFilter, setColumnFilter] = useState({})
  const [columnSorter, setColumnSorter] = useState(null)
  const [records, setRecords] = useState(0)
  const [showAll, setShowAll] = useState(false) // Flag to indicate "Show All" mode

  const navigate = useNavigate()

  const fetchData = async () => {
    setLoading(true)
    setProgress(0) // Reset progress

    // Create a unique cache key based on query parameters
    const cacheKey = `${activePage}-${itemsPerPage}-${JSON.stringify(columnFilter)}-${JSON.stringify(columnSorter)}-${showAll}`

    // Check if data is already in the cache
    if (dataCache.has(cacheKey)) {
      const cachedData = dataCache.get(cacheKey)
      setData(cachedData.data)
      setRecords(cachedData.total_records)
      setLoading(false)
      return
    }

    try {
      let params = new URLSearchParams()
      Object.keys(columnFilter).forEach((key) => {
        params.append(key, columnFilter[key])
      })
      if (columnSorter) {
        params.append('sort', `${columnSorter.column}%${columnSorter.state}`)
      }

      const perPageQuery = showAll
        ? `per_page=${records}` // Fetch all records
        : `page=${activePage}&per_page=${itemsPerPage}`

      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 80)) // Increment progress
      }, 200)

      const response = await fetch(
        `https://sdgstelkomuniversity.id/model/data_dosen?${perPageQuery}&${params.toString()}`,
      )
      const result = await response.json()

      clearInterval(interval) // Clear interval when data is fetched
      setProgress(100) // Set progress to complete

      // Store the data in the cache
      dataCache.set(cacheKey, {
        data: result.data_dosen || [],
        total_records: result.total_records || 0,
      })

      setData(result.data_dosen || [])
      setRecords(result.total_records || 0)
    } catch (error) {
      console.error('Error fetching data:', error)
      setData([])
      setRecords(0)
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 500) // Hide progress after a short delay
    }
  }

  useEffect(() => {
    fetchData()
  }, [activePage, itemsPerPage, columnFilter, columnSorter, showAll])

  // Debounced filter change handler
  const handleFilterChange = debounce((filter) => {
    setColumnFilter(filter)
  }, 300) // 300ms debounce delay

  const columns = [
    { key: 'id', _style: { width: '20%' }, sorter: false },
    { key: 'email', _style: { width: '20%' }, sorter: false },
    { key: 'nama_lengkap', _style: { width: '20%' }, },
    {
      key: 'total_publications',
      label: 'Jumlah Publikasi',
      _style: { width: '20%' },
    },
    {
      key: 'status_pegawai',
      label: 'Status Pegawai',
      _style: { width: '20%' },
      sorter: false,
    },
    {
      key: 'show_details',
      label: 'Detail',
      _style: { width: '30%' },
      filter: false,
      sorter: false,
    },
  ]

  return (
    <div style={{ position: 'relative', overflow: 'auto', height: 'calc(100vh - 100px)' }}>
      {loading && (
        <div>
          <p>Loading...</p>
          <CProgress className="mb-3">
            <CProgressBar value={progress}>{progress}%</CProgressBar>
          </CProgress>
        </div>
      )}
      <CSmartTable
        columns={columns}
        items={data}
        columnFilter
        columnSorter
        itemsPerPage={itemsPerPage}
        itemsPerPageSelect={!showAll} // Disable items per page selector in "Show All" mode
        loading={loading}
        itemsPerPageOptions={[10, 50, 100]}
        pagination={{ external: !showAll }} // Disable pagination in "Show All" mode
        paginationProps={{
          activePage,
          pages: showAll ? 1 : Math.ceil(records / itemsPerPage),
        }}
        tableProps={{
          hover: true,
          responsive: false,
          style: { position: 'relative' },
        }}
        onActivePageChange={(page) => {
          if (!showAll) { // Only handle page change if not in "Show All" mode
            setLoading(true)
            setActivePage(page)
          }
        }}
        onColumnFilterChange={(filter) => {
          handleFilterChange(filter) // Use the debounced function here
        }}
        onItemsPerPageChange={(perPage) => {
          if (!showAll) { // Only handle items per page change if not in "Show All" mode
            setLoading(true)
            setItemsPerPage(perPage)
          }
        }}
        tableHeadProps={{
          style: {
            position: 'sticky',
            top: 0,
            backgroundColor: '#f8d7da',
            zIndex: 1,
          },
        }}
        onSorterChange={(sorter) => {
          setLoading(true)
          setColumnSorter(sorter)
        }}
        scopedColumns={{
          show_details: (item) => (
            <td className="py-2">
              <CButton
                color="primary"
                variant="outline"
                shape="square"
                size="sm"
                onClick={() => {
                  navigate(`/dosen/${itemsPerPage}/${activePage}/${item.id}`)
                }}
              >
                Lihat
              </CButton>
            </td>
          ),
        }}
      />
      <div style={{ marginTop: '10px' }}>
        <CButton
          color="secondary"
          onClick={() => {
            setShowAll(true)
            setLoading(true)
            setProgress(0) // Reset progress when starting to fetch all records
            setActivePage(1) // Reset to page 1 when fetching all records
            setItemsPerPage(records) // Set items per page to the total number of records
          }}
          disabled={showAll}
        >
          Show All
        </CButton>
      </div>
    </div>
  )
}

export default TableDosen
