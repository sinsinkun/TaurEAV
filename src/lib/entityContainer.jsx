import { useDispatch, useSelector } from "react-redux";

import EntityData from "./entityData";
import { fetchValues, openForm, setActiveEntity, setFormInput } from "../store/eav";

const EntityContainer = () => {
  const dispatch = useDispatch();
  const entities = useSelector((state) => state.eav.entities);
  const activeTab = useSelector((state) => state.eav.activeEnType);
  const activeEntity = useSelector((state) => state.eav.activeEntity);

  function fetchData(id) {
    if (activeEntity?.id === id) {
      dispatch(setActiveEntity(0));
    } else {
      dispatch(setActiveEntity(id));
      dispatch(fetchValues(id));
    }
  }

  function confirmDeleteEntity(id) {
    if (activeEntity?.id === id) {
      dispatch(setActiveEntity(0));
    } else {
      dispatch(openForm("delEntity"));
      dispatch(setFormInput({ id: id }));
    }
  }

  function displayNoEntry() {
    if (entities.length < 1) return true;
    if (entities.length === 1) {
      let entity = entities[0].entity;
      if (entity === "-") return true;
    }
    return false;
  }

  return (
    <div className="entry-container">
      <div className="btn-ctn">
        <button onClick={() => dispatch(openForm("entity"))}>+ entity</button>
        <button onClick={() => dispatch(openForm("attr"))}>+ attribute</button>
      </div>
      {displayNoEntry() ? (
        <div className="eav-entry">
          <div className="label">
            {activeTab ? "No entries" : "No tab selected"}
          </div>
        </div>
      ) : (entities.map(e => {
        if (e.entity === "-") return null;
        return (
          <div className="eav-entry" key={"entity-" + e.id}>
            <div className="header">
              <div className="label">{e.entity}</div>
              <button onClick={() => fetchData(e.id)}>
                Details
              </button>
              <button onClick={() => confirmDeleteEntity(e.id)} className="square">
                X
              </button>
            </div>
            {activeEntity?.id === e.id ? <EntityData /> : null}
          </div>
        )
      }))}
    </div>
  )
}

export default EntityContainer;