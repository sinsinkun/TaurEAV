import { useDispatch, useSelector } from "react-redux";

import { toggleShowHelp } from "../store/eav";

function Help() {
  const dispatch = useDispatch();
  const showHelp = useSelector((state) => state.eav.showHelp);

  function closeModal() {
    dispatch(toggleShowHelp());
  }

  if (showHelp) return (
    <div className="modal-container">
      <div className="help-body">
        <h3>Using search</h3>
        <p>Search any valid regex statement for entity names.</p>
        <p>
          Attribute values can be searched with "attr: value", and numerical 
          attributes can be compared with "attr {">"} value" or "attr {"<"}
        </p>
        <br />
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  )
  return null;
}

export default Help;