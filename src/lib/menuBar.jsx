import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { connect, openForm } from "../store/eav";

function MenuBar() {
  const dispatch = useDispatch();
  const connected = useSelector((state) => state.eav.connected);
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

  return (
    <nav>
      <button onClick={openSubmenu}>File</button>
      {openFile && (
        <div className="submenu">
          <button onClick={reconnect}>Reconnect</button>
          <button onClick={newEntityMenu}>New Category</button>
          {/* <button onClick={todo}>Delete Category</button> */}
          {/* <button onClick={todo}>Enable Deletion</button> */}
        </div>
      )}
    </nav>
  )
}

export default MenuBar;