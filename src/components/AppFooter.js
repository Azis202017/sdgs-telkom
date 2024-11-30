import React from 'react'
import { CFooter } from '@coreui/react-pro'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
       
        <span className="ms-1">&copy; 2024 Telkom University.</span>
      </div>

    </CFooter>
  )
}

export default React.memo(AppFooter)
