import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import store from "../store";
import EntityData from "./entityData";
import {
  fetchEntities,
  fetchValues,
  fnsWithPaginationEnum,
  openForm,
  resetScrollToTop,
  searchAttrValue,
  searchAttrValueComparison,
  searchEntity,
  setActiveEntity,
  setFormInput,
} from "../store/eav";

const EntityContainer = () => {
  const dispatch = useDispatch();
  const entities = useSelector((state) => state.eav.entities);
  const entityTypes = useSelector((state) => state.eav.entityTypes);
  const activeTab = useSelector((state) => state.eav.activeEnType);
  const activeEntity = useSelector((state) => state.eav.activeEntity);
  const showDelete = useSelector((state) => state.eav.showDelete);
  const resetScroll = useSelector((state) => state.eav.resetScroll);
  const scrollRef = useRef(null);

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

  function renderType(entity) {
    if (activeTab) return null;
    const [type] = entityTypes.filter(et => et.id === entity.entity_type_id);
    if (!type) return "(?)";
    return "(" + type.entity_type + ")";
  }

  function fetchNextPage() {
    const meta = store.getState()?.eav?.entityMeta;
    if (!meta || meta.end) return;
    switch (meta.fn) {
      case fnsWithPaginationEnum.fetchEntities:
        dispatch(fetchEntities({ id: meta.id, page: meta.page + 1 }));
        break;
      case fnsWithPaginationEnum.searchEntity:
        dispatch(searchEntity({ regex: meta.regex, extended: meta.extended, page: meta.page + 1 }));
        break;
      case fnsWithPaginationEnum.searchAttrValue:
        dispatch(searchAttrValue({ attr: meta.attr, val: meta.val, page: meta.page + 1 }));
        break;
      case fnsWithPaginationEnum.searchAttrValueComparison:
        dispatch(searchAttrValueComparison({ attr: meta.attr, val: meta.val, op: meta.op, page: meta.page + 1 }));
        break;
      default:
        console.log("No fn found in meta", meta);
        return;
    }
  }

  function onScroll(e) {
    const dist = e.target.scrollTop;
    const fullH = e.target.scrollHeight - e.target.clientHeight;
    if (fullH > 50 && fullH - dist < 10) fetchNextPage();
  }

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current?.addEventListener("scroll", onScroll);
    return () => {
      if (scrollRef.current)
        scrollRef.current?.removeEventListener("scroll", onScroll);
    }
  }, [])

  useEffect(() => {
    console.log("reset scroll", resetScroll);
    if (resetScroll) {
      const target = scrollRef.current;
      console.log(target);
      if (target) target.scroll({ top: 0, behaviour: "smooth" });
      dispatch(resetScrollToTop());
    }
  }, [resetScroll])

  return (
    <div className="entry-container" ref={scrollRef}>
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
              <div className="label">{e.entity} {renderType(e)}</div>
              <button onClick={() => fetchData(e.id)}>
                Details
              </button>
              {showDelete && (
                <button onClick={() => confirmDeleteEntity(e.id)} className="square">
                  X
                </button>
              )}
            </div>
            {activeEntity?.id === e.id ? <EntityData /> : null}
          </div>
        )
      }))}
    </div>
  )
}

export default EntityContainer;