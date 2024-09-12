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
        <p>
          Search any valid regex statement for entity names.
          By default, any attributes named "alt_name" will also be queried.
          If only the original entity name should be included in the results,
          add a ! to the start of the query. This will also disable complex
          regex matching.
        </p>
        <p>
          Attribute values can be searched with "attr: value", and numerical 
          attributes can be compared with "attr {">"} value" or "attr {"<"} value".
        </p>
        <h3>Deleting entries</h3>
        <p>
          Delete buttons are appended to values, entities, and category tabs by
          enabling deletion through the file menu. Deleting categories will also 
          delete all associated values, attributes, and entities. Deletions are 
          <b>final</b> and cannot be undone.
        </p>
        <br />
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  )
  return null;
}

export default Help;