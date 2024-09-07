import { useSelector } from 'react-redux';

import EntityContainer from "./entityContainer";
import EntityTypeTabs from "./entityTypeTabs";
import FormModal from "./formModal";

function EavTable() {
  const loading = useSelector((state) => state.eav.loading);

  return (
    <div className="eav-table">
      <EntityTypeTabs />
      <EntityContainer />
      <FormModal />
      {loading && (
        <div className="loading-overlay">
          <div className="loader">Loading...</div>
        </div>
      )}
    </div>
  )
}

export default EavTable;