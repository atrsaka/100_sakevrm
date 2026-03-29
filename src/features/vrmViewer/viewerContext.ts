import { createContext } from "react";
import { Viewer } from "./viewer";

const viewer = new Viewer({ persistViewState: true });

export const ViewerContext = createContext({ viewer });
