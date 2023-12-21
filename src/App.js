import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  // Link
} from "react-router-dom";
import Converter from './Pages/Converter';

function App() {
  return (
      <Router>
        <div>
          <Routes>
           <Route exact path='/' element={<Converter/>}></Route>
          </Routes>
        </div>
      </Router>
  );
}

export default App;