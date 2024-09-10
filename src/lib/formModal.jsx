import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { addAttribute, addEntity, addEntityType, closeForm, deleteEntity, setFormInput } from "../store/eav";

const FormModal = () => {
  const dispatch = useDispatch();
  const formType = useSelector((state) => state.eav.formType);
  const formInput = useSelector((state) => state.eav.formInput);
  const activeEnType = useSelector((state) => state.eav.activeEnType);
  const [fields, setFields] = useState({});
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  function close() {
    setFields({});
    setTitle("");
    setErr("");
    dispatch(closeForm());
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (formType === "delEntity") {
      dispatch(deleteEntity(formInput.id));
      dispatch(setFormInput({}));
      return;
    }
    const form = { ...fields };
    if (formType === "entityType") {
      if (!form.entity_type) return setErr("No name specified");
      dispatch(addEntityType(form));
      close();
      return;
    }
    if (!activeEnType) return setErr("No active tab");
    form.entity_type = activeEnType.entity_type;
    form.entity_type_id = activeEnType.id;
    if (formType === "entity") {
      if (!form.entity) return setErr("No name specified");
      dispatch(addEntity(form));
    }
    if (formType === "attr") {
      if (!form.attr) return setErr("No name specified");
      let regex = new RegExp(/^[-_0-9a-z]+$/i);
      if (!regex.test(form.attr)) return setErr("Attribute name only accepts a-z, 0-9, -, _");
      dispatch(addAttribute(form));
    }
    close();
  }

  function handleInput(e) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    setErr("");
  }

  function handleCheckInput(e) {
    const { name, checked } = e.target;
    setFields(prev => ({ ...prev, [name]: checked }));
    setErr("");
  }

  useEffect(() => {
    switch (formType) {
      case "entityType":
        setTitle("New Category");
        setFields({ entity_type: "" });
        break;
      case "entity":
        setTitle("New Entity");
        setFields({ entity: "" });
        break;
      case "attr":
        setTitle("New Attribute");
        setFields({ attr: "", value_type: "", allow_multiple: false });
        break;
      case "delEntity":
        setTitle("Delete Entity?");
        break;
      default:
        setTitle("Unknown");
        break;
    }
  }, [formType])

  function renderEntityTypeFields() {
    return (
      <>
        <label htmlFor="entity_type">Name</label>
        <input type="text" name="entity_type" onChange={handleInput} />
      </>
    )
  }

  function renderEntityFields() {
    return (
      <>
        <label htmlFor="entity">Name</label>
        <input type="text" name="entity" onChange={handleInput} />
      </>
    )
  }

  function renderAttrFields() {
    return (
      <>
        <label htmlFor="attr">Name</label>
        <input type="text" name="attr" onChange={handleInput} />
        <label htmlFor="value_type">Value Type</label>
        <select name="value_type" onChange={handleInput}>
          <option value=""></option>
          <option value="str">String</option>
          <option value="int">Integer</option>
          <option value="float">Float</option>
          <option value="time">Time</option>
          <option value="bool">Boolean</option>
        </select>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label htmlFor="allow_multiple">Allow Multiple</label>
          <input type="checkbox" name="allow_multiple" onChange={handleCheckInput} />
        </div>
      </>
    )
  }

  if (!formType) return null;
  return (
    <div className="modal-container">
      <form className="modal-form" onSubmit={handleSubmit}>
        <h3>{title}</h3>
        {formType === "entityType" && renderEntityTypeFields()}
        {formType === "entity" && renderEntityFields()}
        {formType === "attr" && renderAttrFields()}
        <div className="btn-ctn">
          <button onClick={close}>Close</button>
          <button type="submit">{formType === "delEntity" ? "Confirm" : "Add"}</button>
        </div>
        {!!err && (
          <div className="err-msg">ERR: {err}</div>
        )}
      </form>
    </div>
  )
}

export default FormModal;