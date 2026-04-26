import './App.css'
import AdminPanel from './pages/AdminPanel';
import ProductRentals from './pages/ProductRentals';
import { StyleContextProvider } from './providers/StyleContextProvider'
import { BrowserRouter, useRoutes } from 'react-router-dom'

const AppRoutes = () => {
    const routes = useRoutes([
        {
            path: "/admin",
            element: <AdminPanel />,
            children: [
              {
                path: "products",
                element: <ProductRentals />
              }
            ]
        },
    ])
    return routes;
};

function App() {
    return (
        <StyleContextProvider>
          <BrowserRouter>
              <AppRoutes />
          </BrowserRouter>
        </StyleContextProvider>
    )
}

export default App
