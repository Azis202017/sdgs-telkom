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
import TableDosen from '../../components/TableDosen'
function Dosen() {
  return (
    <div>
      <CCard>
        <CCardBody>
          <h3>Data Dosen</h3>
          <TableDosen />

        </CCardBody>
      </CCard>
    </div>
  )
}

export default Dosen
