import React, { useState, useContext, useEffect } from "react";

import ReactDOM from "react-dom/client";

import "./index.css";

import "./App.css";

// import reportWebVitals from './reportWebVitals';

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ContextProvider } from "./Context";

// import GeneralContext from './Context';

import { SideBar, MobileTopBar } from "./SideBar/SideBar";

import Modules from "./Components/Modules/Modules";

// import Modules2 from './Components/Modules/Modules2'



import ResourceGroup from "./Components/ResourceGroup/ResourceGroup";

import Alerts from "./Components/Alerts/Alerts_main";



import DashboardResults from "./Components/Dashboards/Dashboard_Results";

// import DashboardRisx from './Components/Dashboards/Dashboard_Risx'

// import DashboardTimesketch from './Components/Dashboards/Dashboard_Timesketch'

import Dashboard_Forensics from "./Components/Dashboards/Dashboard_Forensics";

import Dashboard_Threat_Hunting from "./Components/Dashboards/Dashboard_Threat_Hunting";

import Dashboard_CTI from "./Components/Dashboards/Dashboard_CTI";

import Dashboard_ASM from "./Components/Dashboards/Dashboard_ASM";

import Inventory_main from "./Components/Inventory/Inventory_main";

import MainCompliance from "./Components/Compliance/main_compliance"; // Add this line

import Responder_main from "./Components/Responder/Responder_main"; // Add this line


// import Dashboardold from './Components/Dashboards/Dashboard_old'



import Settings from "./Components/Settings/Settings";

import Users from "./Components/Users/Users";

import Login from "./Pages/Login";

import NoPage404 from "./Pages/NoPage404";



import Constantfunctions from "./Constantfunctions/Constantfunctions";

import VeloConfigMain from "./Components/VeloConfig/VeloConfigMain";

import { AlertsSettings } from "./Components/Alerts/Alert_Settings";

import Dashboard_AI_Vunre from "./Components/Dashboards/Dashboard_AI_Vunre";



export default function App() {

  const [visblePage, set_visblePage] = useState(

    localStorage.getItem("visiblePage") || "Modules"

  );

  const [show_SideBar, set_show_SideBar] = useState(false);

  const [unseen_alert_number, set_unseen_alert_number] = useState(0);

  const [isMainProcessWork, set_isMainProcessWork] = useState(false);

  // const {  backEndURL } = useContext(GeneralContext);



  useEffect(() => {

    console.log("Hello World !!!!!!");

    console.log("Version Of Site is 0.8.7 ");

  }, []);



  return (

    <>

      <div className="app-out">

        <ContextProvider>

          <BrowserRouter>

            {show_SideBar && (

              <MobileTopBar

                visblePage={visblePage}

                set_visblePage={set_visblePage}

                unseen_alert_number={unseen_alert_number}

                set_unseen_alert_number={set_unseen_alert_number}

                isMainProcessWork={isMainProcessWork}

              />

            )}

            {show_SideBar && (

              <SideBar

                visblePage={visblePage}

                set_visblePage={set_visblePage}

                unseen_alert_number={unseen_alert_number}

                set_unseen_alert_number={set_unseen_alert_number}

                isMainProcessWork={isMainProcessWork}

              />

            )}



            {visblePage != "login" && (

              <Constantfunctions

                isMainProcessWork={isMainProcessWork}

                set_isMainProcessWork={set_isMainProcessWork}

              />

            )}



            <Routes>

              <Route path="/" element={<Navigate replace to="/login" />} />

              <Route

                path="login"

                element={

                  <Login

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              />

              <Route

                path="assets"

                element={

                  <ResourceGroup

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              />



              <Route

                path="Modules"

                element={

                  <Modules

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    unseen_alert_number={unseen_alert_number}

                  />

                }

              />



              <Route

                path="alerts"

                element={

                  <Alerts

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    unseen_alert_number={unseen_alert_number}

                  />

                }

              />

              {/* <Route

                path="alertsSettings"

                element={

                  <AlertsSettings

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    unseen_alert_number={unseen_alert_number}

                  />

                }

              /> */}

              <Route

                path="inventory"

                element={

                  <Inventory_main

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              />

              <Route

                path="compliance"

                element={

                  <MainCompliance

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              /> {/* Add this route */}
               <Route

                path="Responder"

                element={

                  <Responder_main

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              /> {/* Add this route */}
              <Route

                path="users"

                element={

                  <Users

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              />



              <Route

                path="dashboard-general"

                element={

                  <DashboardResults

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              />

              <Route

                path="dashboard-forensics"

                element={

                  <Dashboard_Forensics

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    visblePage={visblePage}

                  />

                }

              />

              <Route

                path="dashboard-threat-hunting"

                element={

                  <Dashboard_Threat_Hunting

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    visblePage={visblePage}

                  />

                }

              />

              <Route

                path="dashboard-vulnerability-management"

                element={

                  <Dashboard_AI_Vunre

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    visblePage={visblePage}

                  />

                }

              />

              <Route

                path="dashboard-cti"

                element={

                  <Dashboard_CTI

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    visblePage={visblePage}

                  />

                }

              />

              <Route

                path="dashboard-asm"

                element={

                  <Dashboard_ASM

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    visblePage={visblePage}

                  />

                }

              />



              <Route

                path="settings"

                element={

                  <Settings

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                    set_unseen_alert_number={set_unseen_alert_number}

                    isMainProcessWork={isMainProcessWork}

                    set_isMainProcessWork={set_isMainProcessWork}

                  />

                }

              />

              <Route

                path="OPVelociraptor"

                element={

                  <VeloConfigMain

                    show_SideBar={show_SideBar}

                    set_show_SideBar={set_show_SideBar}

                    set_visblePage={set_visblePage}

                  />

                }

              />



              <Route path="*" element={<NoPage404 />} />

            </Routes>

          </BrowserRouter>

        </ContextProvider>

      </div>

    </>

  );

}



const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);



// <Route path="blogs" element={<Blogs />} />

//   <Route path="contact" element={<Contact />} />

//   <Route path="*" element={<NoPage />} />



// If you want to start measuring performance in your app, pass a function

// to log results (for example: reportWebVitals(console.log))

// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

// reportWebVitals();