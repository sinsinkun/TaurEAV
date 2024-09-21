import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { connect, openForm, toggleShowDel, toggleShowHelp } from "../store/eav";

function MenuBar() {
  const dispatch = useDispatch();
  const connected = useSelector((state) => state.eav.connected);
  const showDelete = useSelector((state) => state.eav.showDelete);
  const activeTab = useSelector((state) => state.eav.activeEnType);
  const [openFile, setOpenFile] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  function closeOnClick(e) {
    if (e.target) e.target?.click();
    setOpenFile(false);
    setOpenEdit(false);
    window.removeEventListener("mouseup", closeOnClick);
  }

  function openSubmenu(type) {
    switch (type) {
      case "file": setOpenFile(true);
        break;
      case "edit": setOpenEdit(true);
        break;
      default:
        return;
    }
    window.addEventListener("mouseup", closeOnClick);
  }

  function reconnect() {
    if (!connected) dispatch(connect());
  }

  function newEntityMenu() {
    dispatch(openForm("entityType"));
  }

  function toggleDeletion() {
    dispatch(toggleShowDel());
  }

  function toggleHelp() {
    dispatch(toggleShowHelp());
  }

  return (
    <nav>
      <button onClick={() => openSubmenu("file")}>File</button>
      {!!activeTab?.id && (
        <button onClick={() => openSubmenu("edit")}>
          Edit {">"} {activeTab.entity_type}
        </button>
      )}
      {openFile && (
        <div className="submenu">
          <button onClick={reconnect}>Reconnect</button>
          <button onClick={newEntityMenu}>New Category</button>
          <button onClick={toggleDeletion}>
            {showDelete ? "Disable Deletion" : "Enable Deletion"}
          </button>
          <button onClick={toggleHelp}>Help</button>
        </div>
      )}
      {openEdit && (
        <div className="submenu" style={{left: "45px" }}>
          <button onClick={() => dispatch(openForm("attr"))}> + Attribute</button>
          <button onClick={() => dispatch(openForm("entity"))}> + Entity</button>
        </div>
      )}
    </nav>
  )
}

export default MenuBar;