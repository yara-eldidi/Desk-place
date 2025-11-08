import "react-datepicker/dist/react-datepicker.css";
import {useRoutes } from "react-router-dom";
import routes from "./Routes";

export default function App() {
  const elements = useRoutes(routes);
  return elements
}
