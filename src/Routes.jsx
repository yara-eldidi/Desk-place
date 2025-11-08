import HomePage from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"


const routes = [
  {path : '/' ,
    element : <HomePage/>
  },
  {path : '/login' ,
    element : <Login/>
  },
  {path : '/signup' ,
    element : <Signup/>
  }
  
]

export default routes