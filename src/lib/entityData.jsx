import { useSelector } from "react-redux";
import ValueRow from "./valueRow";

const EntityData = () => {
  const valuesData = useSelector((state) => state.eav.values);

  if (valuesData.length < 1) return (
    <div className="value-container">No attributes found</div>
  )
  return (
    <div className="value-container">
      {valuesData.map(v => <ValueRow key={"value-" + v.attr_id + v.value_id} data={v} />)}
    </div>
  )
}

export default EntityData;