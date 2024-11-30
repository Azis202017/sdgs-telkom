import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilBook,
  cilCalculator,
  cilCalendar,
  cilChartPie,
  cilCursor,
  cilDrop,
  cilEnvelopeOpen,
  cilGrid,
  cilHome,
  cilLayers,
  cilMap,
  cilNotes,
  cilPencil,
  cilPeople,
  cilPuzzle,
  cilSpeedometer,
  cilSpreadsheet,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react-pro'
import { Translation } from 'react-i18next'

const _nav = [
  {
    component: CNavItem,
    name: <Translation>{(t) => t('dashboard')}</Translation>,
    to: '/dashboard',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,

  },
  {
    component: CNavItem,
    name: <Translation>{(t) => t('Data Artikel')}</Translation>,
    to: '/data-artikel',
    icon: <CIcon icon={cilBook} customClassName="nav-icon" />,

  },
  {
    component: CNavItem,
    name: <Translation>{(t) => t('Data Dosen')}</Translation>,
    to: '/dosen',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,

  },



]

export default _nav
