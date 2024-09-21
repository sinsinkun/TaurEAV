import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearValues,
  connect,
  fetchEntities,
  fetchEntityTypes,
  setActiveEnType,
  setFormInput,
  openForm,
} from "../store/eav";

const EntityTypeTabs = () => {
  const dispatch = useDispatch();
  const connected = useSelector((state) => state.eav.connected);
  const loading = useSelector((state) => state.eav.loading);
  const tabs = useSelector((state) => state.eav.entityTypes);
  const activeTab = useSelector((state) => state.eav.activeEnType);
  const showDelete = useSelector((state) => state.eav.showDelete);

  function loadEntities(id) {
    dispatch(clearValues());
    dispatch(fetchEntities({ id }));
    dispatch(setActiveEnType(id));
  }

  function openDelForm(id) {
    dispatch(openForm("delEntityType"));
    dispatch(setFormInput({ id: id }));
  }

  useEffect(() => {
    if (!connected) dispatch(connect());
    else if (!loading) dispatch(fetchEntityTypes());
    // eslint-disable-next-line
  }, [connected])

  if (!connected) return <div className="tab-container">DB not connected</div>
  return (
    <div className="tabs-container">
      {tabs.map(et => {
        let className = "tab";
        if (activeTab?.id == et.id) className += " selected";
        return (
          <div className="tab-container" key={et.id}>
            <div className={className} onClick={() => loadEntities(et.id)}>
              {et.entity_type}
            </div>
            {showDelete && (
              <div className="del-icon" onClick={() => openDelForm(et.id)}>x</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default EntityTypeTabs;