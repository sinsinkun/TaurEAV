import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { connect, openForm, toggleShowDel } from "../store/eav";

function MenuBar() {
  const dispatch = useDispatch();
  const connected = useSelector((state) => state.eav.connected);
  const showDelete = useSelector((state) => state.eav.showDelete);
  const [openFile, setOpenFile] = useState(false);

  function closeOnClick(e) {
    if (e.target) e.target?.click();
    setOpenFile(false);
    window.removeEventListener("mouseup", closeOnClick);
  }

  function openSubmenu() {
    setOpenFile(true);
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

  return (
    <nav>
      <button onClick={openSubmenu}>File</button>
      {openFile && (
        <div className="submenu">
          <button onClick={reconnect}>Reconnect</button>
          <button onClick={newEntityMenu}>New Category</button>
          {/* <button onClick={todo}>Delete Category</button> */}
          <button onClick={toggleDeletion}>
            {showDelete ? "Disable Deletion" : "Enable Deletion"}
          </button>
          <button>Help</button>
        </div>
      )}
    </nav>
  )
}

export default MenuBar;