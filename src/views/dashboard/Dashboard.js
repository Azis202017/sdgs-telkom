import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

import {
  CAvatar,
  CButton,
  CCard,
  CCardBody,
  CCardSubtitle,
  CCardTitle,
  CCol,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsA,
} from '@coreui/react-pro'
import { CChartDoughnut } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import CIcon from '@coreui/icons-react'
import {
  cibGoogle,
  cibFacebook,
  cibLinkedin,
  cifBr,
  cifEs,
  cifFr,
  cifIn,
  cifPl,
  cifUs,
  cibTwitter,
  cilPeople,
  cilUser,
  cilUserFemale,
  cilArrowBottom,
  cilCart,
  cilArrowTop,
  cilUserPlus,
  cilOptions,
} from '@coreui/icons'

const Dashboard = () => {
  const [chartData, setChartData] = useState({ datasets: [] })
  const [availableYears, setAvailableYears] = useState([]) // State for available years
  const [selectedYear, setSelectedYear] = useState('') // State for the selected year

  // Fetch available years on component mount
  useEffect(() => {
    axios
      .get('https://sdgstelkomuniversity.id/model/get-sdgs-count') // Adjust the endpoint if needed
      .then((response) => {
        const years = response.data.available_years || []
        // Sort years in descending order
        const sortedYears = years.sort((a, b) => b - a)
        setAvailableYears(sortedYears)
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]) // Set the latest year as the default
        }
      })
      .catch((error) => {
        console.error('There was an error fetching the available years!', error)
      })
  }, [])

  // Fetch chart data based on the selected year
  useEffect(() => {
    if (selectedYear) {
      axios
        .get(`https://sdgstelkomuniversity.id/model/get-sdgs-count?Tahun=${selectedYear}`)
        .then((response) => {
          const data = response.data.sdgs_count

          // Define SDGs range
          const sdgsRange = Array.from({ length: 17 }, (_, i) => `SDGS${i + 1}`)

          // Filter data to include only SDGs present in the response and with non-zero values
          const filteredKeys = sdgsRange
            .filter((key) => data.hasOwnProperty(key) && data[key] > 0)
            .sort((a, b) => parseInt(a.replace('SDGS', '')) - parseInt(b.replace('SDGS', '')))

          // Map sorted keys to labels and values
          const sortedLabels = filteredKeys.map((key) => `SDGS ${key.replace('SDGS', '')}`)
          const sortedValues = filteredKeys.map((key) => data[key])

          // Generate colors for each segment
          const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40',
            '#FFCD56', '#4BC0C0', '#36A2EB', '#FF6384', '#FFCE56',
            '#F1C40F', '#E67E22', '#2ECC71', '#1F77B4', '#D62728',
            '#9467BD', '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22',
          ]

          // Adjust colors to match the number of data points
          const colors = backgroundColors.slice(0, sortedLabels.length)
          if (sortedLabels.length > backgroundColors.length) {
            // Repeat colors if not enough colors are provided
            const repeatedColors = []
            for (let i = 0; i < sortedLabels.length; i++) {
              repeatedColors.push(backgroundColors[i % backgroundColors.length])
            }
            setChartData({
              labels: sortedLabels,
              datasets: [
                {
                  data: sortedValues,
                  backgroundColor: repeatedColors,
                  borderWidth: 1,
                },
              ],
            })
          } else {
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
          }
        })
        .catch((error) => {
          console.error('There was an error fetching the data!', error)
        })
    }
  }, [selectedYear]) // Re-run the effect when selectedYear changes

  // Handle year change
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value)
  }

  return (
    <>
      <CCard>
        <CCardBody>
        <h1>SDGS</h1>
        <p>Pemetaan 17 Bidang Tujuan Pembangunan Berkelanjutan (SDGs) Dosen Telkom University</p>

          <img
            src="https://dinaspmd.kalselprov.go.id/wp-content/uploads/2023/11/SDGs-Indonesia.jpg"
            alt="Kumpulan data sdgs"
            className="img-fluid"
          />
        </CCardBody>
      </CCard>

      {/* Select dropdown for year selection */}
      <CCard className="mt-3 mb-3">
        <CCardBody>
          <h4>Select Year</h4>
          <select onChange={handleYearChange} value={selectedYear} className='form-control w-25'>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </CCardBody>
      </CCard>

      <CCard className="mt-3 mb-5">
        <CCardBody>
          <h3>Penyebaran SDGS</h3>
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
            height={350}
            data={chartData}
          />
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard
