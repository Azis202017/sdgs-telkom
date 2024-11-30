
import React from 'react'

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
import TableSkripsi from '../../components/TableSkripsi'

function Skripsi() {
  return (
    <CCard>
      <CCardBody>
        <h3>Data Artikel</h3>
        <TableSkripsi />
      </CCardBody>
    </CCard>
  )
}

export default Skripsi
