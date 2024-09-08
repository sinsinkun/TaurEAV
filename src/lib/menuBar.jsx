import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { connect } from "../store/eav";

function MenuBar() {
  const dispatch = useDispatch();
  const connected = useSelector((state) => state.eav.connected);
  const [openFile, setOpenFile] = useState(false);

  function closeOnClick() {
    setOpenFile(false);
    window.removeEventListener("mousedown", closeOnClick);
  }

  function openSubmenu() {
    setOpenFile(true);
    window.addEventListener("mousedown", closeOnClick);
  }

  function reconnect() {
    if (!connected) dispatch(connect());
  }

  return (
    <nav>
      <button onClick={openSubmenu}>File</button>
      {openFile && (
        <div className="submenu">
          <button onClick={reconnect}>Reconnect</button>
        </div>
      )}
    </nav>
  )
}

export default MenuBar;