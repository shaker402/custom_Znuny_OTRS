

import React, { useState, useContext, useEffect } from "react";

import { useNavigate } from "react-router-dom";



import "./SideBar.css";

import { ReactComponent as RisxMsspLogo } from "../Components/Logos/RisxMssp_logo_Standart.svg";

import { ReactComponent as RisxMsspLogoWide } from "../Components/Logos/RisxMssp_logo_wide.svg";

import { ReactComponent as IcoMonitor } from "../Components/icons/ico-menu-monitor.svg";

import { ReactComponent as IcoModules } from "../Components/icons/ico-menu-modules.svg";

import { ReactComponent as IcoLink } from "../Components/icons/ico-menu-link.svg";

import { ReactComponent as IcoIframe } from "../Components/icons/ico-menu-iframe.svg";

import { ReactComponent as IcoResults } from "../Components/icons/ico-menu-Results.svg";

import { ReactComponent as IcoResourceGroup } from "../Components/icons/ico-menu-Resource-Group.svg";

import { ReactComponent as IcoAccount } from "../Components/icons/ico-menu-account.svg";

import { ReactComponent as IcoSettings } from "../Components/icons/ico-settings.svg";

import { ReactComponent as IcoDownload } from "../Components/icons/ico-menu-download.svg";

import { ReactComponent as IcoACtive } from "../Components/icons/ico-menu-active.svg";

import { ReactComponent as IcoACtiveBlue } from "../Components/icons/ico-menu-active-blue.svg";

import { ReactComponent as IconUsers } from "../Components/icons/ico-menu-users.svg";

import { ReactComponent as IconAlert } from "../Components/icons/ico-menu-alert.svg";
import XDRDownloadProgressBarItem from "./XDRDownloadProgressBarItem";


import {

  PopUp_Error,

  PopUp_All_Good,

  PopUp_Under_Construction,

  PopUp_Confirm_Run_selected,

} from "../Components/PopUp_Smart";



import GeneralContext from "../Context";

import axios from "axios";

import { Make_url_from_id } from "../Components/Dashboards/functions_for_dashboards";

import DownloadProgressBarItem from "./DownloadProgressBarItem";



const SideBar = ({ visblePage, set_visblePage }) => {

  const navigate = useNavigate();
  const [DownloadXDRDropDown, setDownloadXDRDropDown] = useState(false);
  const [DownloadXDROnlineDrop, setDownloadXDROnlineDrop] = useState(false);
  const [DownloadXDROfflineDrop, setDownloadXDROfflineDrop] = useState(false);
  const [XDRDownloadProgressBar, setXDRDownloadProgressBar] = useState({});


  const [user_name, set_user_name] = useState("user");

  const {

    backEndURL,

    moduleLinks,

    front_IP,

    DownloadProgressBar,

    setDownloadProgressBar,

    setDownloadList,

    set_Assets_Preview_List,

    Assets_Preview_List,

    UploadProgressBar,

    setUploadProgressBar,

    UpdateSideBar,

    // front_URL,

    // mssp_config_json,

    // user_id,

  } = useContext(GeneralContext);
  const handleToggleXDRDropDown = () => {
    setDownloadXDRDropDown(!DownloadXDRDropDown);
  };
const handleDownloadXDR = async (os, type) => {
  const fileMap = {
    Online: {
      Windows: "windows_install.ps1",
      Linux: "linux_scripts.zip",
      Mac: "mac_install.sh",
    },
    Offline: {
      Light: "uninstall_windows.ps1",
      "Best-Practice": "uninstall_linux.zip",
      "new_Best-Practice": "uninstall_MAC.zip",
    },
  };

  const fileName = fileMap[type][os];
  const itemKey = `${fileName}_${Date.now()}`;

  // Initialize XDR-specific progress
  setXDRDownloadProgressBar(prev => ({
    ...prev,
    [itemKey]: { fileName, progress: 0 }
  }));

  try {
    const response = await axios.post(
      `${backEndURL}/xdr/DownloadXDRAgent`,
      { PathOs: fileName },
      {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total > 0 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
            
          setXDRDownloadProgressBar(prev => ({
            ...prev,
            [itemKey]: { ...prev[itemKey], progress }
          }));
        }
      }
    );

    // Handle successful download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);


  // Show success popup
    set_PopUp_All_Good__txt({
      HeadLine: "Download Complete",
      paragraph: `${fileName} downloaded successfully`,
      buttonTitle: "Close",
    });
    set_PopUp_All_Good__show(false);

  } catch (error) {
    console.error("XDR Download failed:", error);
    setXDRDownloadProgressBar(prev => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], progress: "ERR" }
    }));
    
    // Add error popup
    set_PopUp_Error____txt({
      HeadLine: "Download Failed",
      paragraph: `Failed to download ${fileName}: ${error.message}`,
      buttonTitle: "Close",
    });
    set_PopUp_Error____show(true);
    
    // Error handling for backend messages
    if (error.response && error.response.data) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result);
          set_PopUp_Error____txt(prev => ({
            ...prev,
            paragraph: `${prev.paragraph} (Server: ${errorData.error})`
          }));
        } catch (e) {
          console.error("Non-JSON error response");
        }
      };
      reader.readAsText(error.response.data);
    }
  }
};


  const [PopUp_All_Good__show, set_PopUp_All_Good__show] = useState(false);
  // Add this with other popup states in SideBar component
const [PopUp_Error____show, set_PopUp_Error____show] = useState(false);
const [PopUp_Error____txt, set_PopUp_Error____txt] = useState({
  HeadLine: "",
  paragraph: "",
  buttonTitle: "",
});

  const [PopUp_All_Good__txt, set_PopUp_All_Good__txt] = useState({

    HeadLine: "Success",

    paragraph: "successfully",

    buttonTitle: "Close",

  });



  const [PopUp_Under_Construction__show, set_PopUp_Under_Construction__show] =

    useState(false);

  const [PopUp_Under_Construction__txt, set_PopUp_Under_Construction__txt] =

    useState({

      HeadLine: "Coming Soon!",

      paragraph:

        "We are working on creating this section. Stay tuned for updates as we finalize the details.",

      buttonTitle: "Close",

    });



  const [

    PopUp_Confirm_Run_selected__show,

    set_PopUp_Confirm_Run_selected__show,

  ] = useState(false);



  const [download_drop_down, set_download_drop_down] = useState(false);

  const [Dashboards_drop_down, set_Dashboards_drop_down] = useState(false);

  const [VeloDropDownStepOne, setVeloDropDownStepOne] = useState(false);

  const [DownloadAllAgentsDrop, setDownloadAllAgentsDrop] = useState(false);

  const [DropDownAlerts, setDropDownAlerts] = useState(false);



  const [object, setObject] = useState({});

  const [VelociraptorCollectorsList, setVelociraptorCollectorsList] = useState(

    []

  );

  const [OpenVeloCollectorList, setOpenVeloCollectorList] = useState([]);

  // This IS Temporary

  const [TurnOnAlerts, setTurnOnAlerts] = useState(false);



  const get_config = async () => {

    if (backEndURL === undefined) {

      return;

    }

    try {

      const res = await axios.get(`${backEndURL}/config`);



      if (res) {

        console.log("get_config", res.data);

      }

      console.log(

        res?.data?.General?.AlertDictionary?.["Python.Suspicious.File.Found"]

          ?.Log,

        "88888888888888888888888888888888888888888888888888888888888888888888888888"

      );

      setTurnOnAlerts(

        res?.data?.General?.AlertDictionary?.["Python.Suspicious.File.Found"]

          ?.Log

      );

      setObject(res.data);

    } catch (err) {

      console.log(err);

      set_PopUp_Error____show(true);

      set_PopUp_Error____txt({

        HeadLine: "Error",

        paragraph: "Error in Getting Config",

        buttonTitle: "OK",

      });

    }

  };



  useEffect(() => {

    if (backEndURL) {

      get_config();

    }

  }, [backEndURL]);



  const handleClick = (page_name) => {

    set_visblePage(page_name);

    localStorage.setItem("visiblePage", page_name); // Store current page in localStorage

    navigate(`/${page_name.toLowerCase()}`); // This navigates to the path specified by page_name\

  };



  const handleNewWindow = (dashboard_name) => {

    const url = Make_url_from_id(dashboard_name, moduleLinks, front_IP);

    console.log("handleNewWindow url - ", url);



    if (url) {

      window.open(url, "_blank");

    }

  };



  const handle_Dashboards_drop_down = () => {

    set_Dashboards_drop_down(!Dashboards_drop_down);

  };



  const handle_download_drop_down = () => {

    set_download_drop_down(!download_drop_down);

  };

  const HandleVeloDropDownStepOne = () => {

    setVeloDropDownStepOne(!VeloDropDownStepOne);

  };

  const handleDownload = async (os) => {
  let fileName; // Declare outside try
  let itemKey;  // Declare outside try
    console.log("os", os);

    // window.open(object?.General?.AgentLinks[os]);

    try {

      set_PopUp_All_Good__txt({

        HeadLine: `Download ${os} Agent Start`,

        paragraph:

          "This download can take a few minutes. The file will appear in your download folder once the process is complete.",

        buttonTitle: "Close",

      });

      // set_PopUp_All_Good__show(false);

       fileName = object?.General?.AgentLinks[os]?.split("/")?.pop();
      
       itemKey = `${fileName}_${Date.now()}`; // Unique key
	   
  // Check for existing download
  if (DownloadProgressBar[itemKey]) {
    console.log("Download already in progress");
    return;
  }

  // Initialize progress
  setDownloadProgressBar(prev => ({
    ...prev,
    [itemKey]: { fileName, progress: 0 }
  }));
  
      const fileName2 =

        object?.General?.AgentLinks[os]?.split("/")?.pop() + Math.random();
        


      const res = await axios.post(

        `${backEndURL}/config/DownloadAgent`,

        {

          PathOs: object?.General?.AgentLinks[os],

        },

        {

          responseType: "blob",

          onDownloadProgress: (prog) => {

            console.log(prog, "prog");



            const value = Math.round((prog.loaded / prog.total ?? 1) * 100);

            if (!DownloadProgressBar[fileName2]) {

              console.log("empty 1111111111111111111111");

              // const copy = DownloadList.map((x) => x);

              // copy.push(fileName);

              // console.log(

              //   "DownloadListDownloadListDownloadListDownloadListDownloadListDownloadListDownloadListDownloadListDownloadList",

              //   DownloadList

              // );

              // setDownloadList(copy);

              console.log("iiiuiuiuiu");



              if (value < 100) {

                DownloadProgressBar[fileName2] = {

                  progress: value,

                  fileName: fileName,

                };

              }

            }



            if (

              (DownloadProgressBar[fileName2]?.progress + 5 < value ||

                (value >= 100 &&

                  DownloadProgressBar[fileName2]?.progress != 100)) &&

              DownloadProgressBar[fileName2]?.progress !== undefined

            ) {

              console.log("Download Prog ", value, DownloadProgressBar);

              DownloadProgressBar[fileName2] = {

                progress: value,

                fileName: fileName,

              };

              setDownloadProgressBar(DownloadProgressBar);

              setDownloadList(Math.random());

            }

          },

        }

      );

      console.log("ssssssssss", res.data);



      if (res) {

        // console.log("ssssssssssssssssssssssss", fileName);

        const url = window.URL.createObjectURL(res.data);

        console.log(url);



        // window.open(url)

        // console.log(fileName, "zzzzzzzzzzzzzzzzzzzzzzzzzzzz");

        var link = document.createElement("a");

        link.href = url;

        link.download = fileName;

        link.click();

      }

// In SideBar.jsx - Update handleDownload error handling
} catch (err) {
  console.error("Download failed:", err);

  // Remove the agent download progress indicator if needed
  setDownloadProgressBar(prev => {
    const updated = { ...prev };
    delete updated[itemKey];
    return updated;
  });

  // Prepare error message, optionally parse additional info from error.response.data
  let errorMessage = err.message;
  if (err.response && err.response.data) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const errorData = JSON.parse(reader.result);
        // Update the popup error text with additional server message
        set_PopUp_Error____txt(prev => ({
          ...prev,
          paragraph: `${prev.paragraph} (Server: ${errorData.error || "Unknown error"})`
        }));
      } catch (e) {
        console.error("Non-JSON error response");
      }
    };
    reader.readAsText(err.response.data);
  }

  // Show error popup
  set_PopUp_Error____txt({
    HeadLine: "Download Failed",
    paragraph: `Failed to download ${fileName}: ${errorMessage}`,
    buttonTitle: "Close",
  });
  set_PopUp_Error____show(true);
}


  };



  const handle_click_user = async () => {

    set_PopUp_Error____txt({

      HeadLine: "Work in Progress..",

      paragraph:

        "Final touches underway; anticipate completion shortly. Stay tuned for updates.",

      buttonTitle: "Close",

    });

    set_PopUp_Error____show(true);

  };



  const handle_active_manual_process = async () => {

    set_PopUp_Confirm_Run_selected__show(false);

    console.log("handle_active_manual_process");

    try {

      const res = await axios.get(

        `${backEndURL}/process/active-manual-process`,

        { params: { param1: "param1value" } }

      );



      if (res.data) {

        console.log("handle_active_manual_process - data", res?.data);

        console.log("handle_active_manual_process - status", res?.status);

        if (res?.data?.success === true) {

          console.log(

            "A Manual Process has Started to run",

            "message;",

            res?.data?.message

          );

          set_PopUp_All_Good__txt({

            HeadLine: "Activated",

            paragraph: "A Manual Process has Started to run",

            // paragraph: res?.data?.message,

            buttonTitle: "Close",

          });

          set_PopUp_All_Good__show(false);

        } else {

          set_PopUp_Error____txt({

            HeadLine: "Error",

            paragraph: `${res?.data?.message}`,

            buttonTitle: "Close",

          });

          set_PopUp_Error____show(true);

        }

      }

    } catch (err) {

      set_PopUp_Error____txt({

        HeadLine: "Error",

        paragraph: `${err?.response?.data?.message}`,

        buttonTitle: "Close",

      });

      set_PopUp_Error____show(true);

      console.log(

        "catch handle_active_manual_process - data",

        err?.response?.data

      );

      // console.log("catch handle_active_manual_process - error", err?.response?.data?.error);

      // console.log("catch handle_active_manual_process - message", err?.response?.data?.message);

      // console.log("catch handle_active_manual_process - success", err?.response?.data?.success);

      console.log(err);

    }

  };



  const handle_cancel_active_manual_process = () => {

    console.log("handle_cancel_active_manual_process item...");

    set_PopUp_Confirm_Run_selected__show(false);

  };



  useEffect(() => {

    const name = localStorage.getItem("username");



    if (name) {

      set_user_name(name);

    } else {

      console.log("No username found in local storage.");

    }

  }, []);



  const GetVeloCollectors = async () => {

    try {

      console.log("GetVeloCollectors");

      const res = await axios.get(

        `${backEndURL}/config/GetAllVeloConfigSideBar`

      );

      console.log(

        res.data,

        "sssssssss5555555555555555555555555555555555555555555555"

      );

      if (res.data) {

        setVelociraptorCollectorsList(res.data ?? []);

      }

    } catch (error) {

      console.log("Error in GetVeloCollectors", error);

      set_PopUp_Error____txt({

        HeadLine: "Error",

        paragraph: "Error Happened During Fetching of Collector",

        buttonTitle: "Close",

      });

      set_PopUp_Error____show(true);

    }

  };

  useEffect(() => {

    if (backEndURL) {

      GetVeloCollectors();

    }

  }, [backEndURL, UpdateSideBar]);



  const handleClickComingSoon = (page_name) => {

    set_PopUp_Under_Construction__txt({

      HeadLine: "Coming Soon!",

      paragraph: `We are working on creating the ${page_name} section. Stay tuned for updates as we finalize the details.`,

      buttonTitle: "Close",

    });

    set_PopUp_Under_Construction__show(true);

  };



  const HandleVeloClickOne = async (id) => {

    try {

      const tmpArr = [...OpenVeloCollectorList];

      if (tmpArr.includes(id)) {

        tmpArr.splice(

          tmpArr?.findIndex((x) => x == id),

          1

        );



        setOpenVeloCollectorList(tmpArr);

      } else {

        tmpArr.push(id);



        setOpenVeloCollectorList(tmpArr);

      }

    } catch (error) {

      console.log("Error in HandleVeloClickOne", error);

      set_PopUp_Error____txt({

        HeadLine: "Error",

        paragraph: "Error Happened During Click one",

        buttonTitle: "Close",

      });

      set_PopUp_Error____show(true);

    }

  };



const HandleVeloClickTwo = async (id, os, nameZip) => {
  try {
    console.log("HandleVeloClickTwo", id, os);
    const NameOfFile = `${nameZip}-${os}`;
    const NameOfFile2 = `${nameZip}-${os}` + Math.random();

    // Show the start download popup
    set_PopUp_All_Good__show(true);
    set_PopUp_All_Good__txt({
      HeadLine: `Start Download for ${nameZip}-${os}`,
      paragraph: "It may take a couple of seconds to start the download.",
      buttonTitle: "Close",
    });

    const res = await axios.post(
      `${backEndURL}/config/GetSpecificCollector`,
      { id, os },
      {
        responseType: "blob",
        onDownloadProgress: (prog) => {
          console.log("Progress event:", prog);
          // Use (prog.total || 1) as a guard against division by zero
          const value = Math.round((prog.loaded / (prog.total || 1)) * 100);

          // Initialize progress if not set and below 100%
          if (!DownloadProgressBar[NameOfFile2] && value < 100) {
            DownloadProgressBar[NameOfFile2] = {
              progress: value,
              fileName: NameOfFile,
            };
          }

          // Update progress if there's a significant change or it just completed
          if (
            (DownloadProgressBar[NameOfFile2]?.progress + 5 < value ||
              (value >= 100 &&
                DownloadProgressBar[NameOfFile2]?.progress !== 100)) &&
            DownloadProgressBar[NameOfFile2]?.progress !== undefined
          ) {
            DownloadProgressBar[NameOfFile2] = {
              progress: value,
              fileName: NameOfFile,
            };
            setDownloadProgressBar({ ...DownloadProgressBar });
            setDownloadList(Math.random());
          }
        },
      }
    );

    // Hide the start popup after download is initiated successfully.
    set_PopUp_All_Good__show(false);

    if (res) {
      console.log("Download response received", res);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${NameOfFile}.zip`;
      link.click();
    } else {
      // No response receivedtreat as an error.
      set_PopUp_Error____txt({
        HeadLine: "Error",
        paragraph:
          "Error occurred during download: No response received from server.",
        buttonTitle: "Close",
      });
      set_PopUp_Error____show(true);
    }
  } catch (error) {
    console.error("Error in HandleVeloClickTwo:", error);
    // Hide start download popup before showing error
    set_PopUp_All_Good__show(false);

    let errorMessage = error.message || "Unknown error";

    // If error.response is missing, show the error popup immediately.
    if (!error.response) {
      set_PopUp_Error____txt({
        HeadLine: "Download Failed",
        paragraph: `Failed to download ${nameZip}-${os}: ${errorMessage}`,
        buttonTitle: "Close",
      });
      set_PopUp_Error____show(true);
      return;
    }

    // If error.response is present, try to read its content.
    try {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result);
          errorMessage += ` (Server: ${
            errorData.error || "Unknown error"
          })`;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        set_PopUp_Error____txt({
          HeadLine: "Download Failed",
          paragraph: `Failed to download ${nameZip}-${os}: ${errorMessage}`,
          buttonTitle: "Close",
        });
        set_PopUp_Error____show(true);
      };
      reader.readAsText(error.response.data);
    } catch (readerError) {
      console.error("Error reading error response:", readerError);
      set_PopUp_Error____txt({
        HeadLine: "Download Failed",
        paragraph: `Failed to download ${nameZip}-${os}: ${errorMessage}`,
        buttonTitle: "Close",
      });
      set_PopUp_Error____show(true);
    }
  }
};





  return (

    <>

      <div className="side-bar-desktop-out">

        {PopUp_Confirm_Run_selected__show && (

          <PopUp_Confirm_Run_selected

            popUp_show={PopUp_Confirm_Run_selected__show}

            set_popUp_show={set_PopUp_Confirm_Run_selected__show}

            True_action={handle_active_manual_process}

            False_action={handle_cancel_active_manual_process}

          />

        )}



        {PopUp_Under_Construction__show && (

          <PopUp_Under_Construction

            popUp_show={PopUp_Under_Construction__show}

            set_popUp_show={set_PopUp_Under_Construction__show}

            HeadLine={PopUp_Under_Construction__txt.HeadLine}

            paragraph={PopUp_Under_Construction__txt.paragraph}

            buttonTitle={PopUp_Under_Construction__txt.buttonTitle}

          />

        )}



        {PopUp_All_Good__show && (

          <PopUp_All_Good

            popUp_show={PopUp_All_Good__show}

            set_popUp_show={set_PopUp_All_Good__show}

            HeadLine={PopUp_All_Good__txt.HeadLine}

            paragraph={PopUp_All_Good__txt.paragraph}

            buttonTitle={PopUp_All_Good__txt.buttonTitle}

          />

        )}



        {PopUp_Error____show && (

          <PopUp_Error

            popUp_show={PopUp_Error____show}

            set_popUp_show={set_PopUp_Error____show}

            HeadLine={PopUp_Error____txt.HeadLine}

            paragraph={PopUp_Error____txt.paragraph}

            buttonTitle={PopUp_Error____txt.buttonTitle}

          />

        )}



        <RisxMsspLogo className="mt-c mb-b logo-main" />



        <button className="btn-menu  " onClick={handle_click_user}>

          <div className="display-flex">

            <IcoAccount className="btn-menu-icon-placeholder  mr-a " />

            <p className="font-type-menu ">{user_name}</p>

            {/* <span className='notification'><p className='font-type-very-sml-txt'>2</p></span> */}

          </div>

          <div className="btn-menu-icon-placeholder  ">

            {" "}

            {/*  <MenuArrowDown  />*/}

          </div>

        </button>



        <div

          className="Bg-Grey2"

          style={{ width: "100%", height: "2px", borderRadius: "5px" }}

        />



        <div className="btn-menu-list  ">

          {/* ..........Dashboards.......srart.... */}



          <button

            className="btn-menu"

            onClick={() => handleClick("Modules")}

            disabled={visblePage === "Modules"}

          >

            <div className="display-flex">

              <IcoModules className="btn-menu-icon-placeholder  mr-a " />

              <p className="font-type-menu ">Modules</p>

            </div>

            <div className="btn-menu-icon-placeholder  ">

              {" "}

              {/*  <MenuArrowDown  />*/}

            </div>

          </button>



          <div

            className="btn-menu-list"

            style={{ gap: !Dashboards_drop_down && 0 }}

            // onMouseLeave={() => set_Dashboards_drop_down(false)}

            //  onMouseEnter={()=>set_download_drop_down(true)}

          >

            <button

              className={`btn-menu  ${

                Dashboards_drop_down || visblePage.startsWith("dashboard")

                  ? "btn_look_hover"

                  : ""

              } `}

              onClick={handle_Dashboards_drop_down}

            >

              <div className="display-flex">

                <IcoMonitor className="btn-menu-icon-placeholder  mr-a " />



                <p className="font-type-menu ">

                  Dashboards{visblePage.startsWith("dashboard") && ":"}

                </p>



                {visblePage.startsWith("dashboard") && (

                  <p

                    className="ml-a font-type-very-sml-txt"

                    style={{ textAlign: "left" }}

                  >

                    {visblePage

                      .replace("dashboard-", "")

                      .split("-")

                      .map((word, index) => {

                        if (index === 0 && word.length === 3) {

                          return word?.toUpperCase();

                        }

                        return word

                          .split(" ")

                          .map(

                            (subWord) =>

                              subWord?.charAt(0)?.toUpperCase() +

                              subWord?.slice(1)

                          )

                          .join(" ");

                      })

                      .join(" ")}

                  </p>

                )}

              </div>

              <div className="btn-menu-icon-placeholder  ">

                {" "}

                {/*  <MenuArrowDown  />*/}

              </div>

            </button>



            <div

              className={`dropdown-menu ${Dashboards_drop_down ? "open" : ""} `}

            >

              <button

                className="btn-menu dropdown-menu-btn"

                onClick={() => handleClick("dashboard-general")}

                disabled={visblePage === "dashboard-general"}

                // style={{marginBottom:0 , paddingBottom:0 , backgroundColor:"pink"}}

              >

                <div className="display-flex">

                  {/* <IcoDownload

                  className="btn-menu-icon-placeholder  mr-a "

                  style={{ visibility: "hidden" }}

                /> */}

                  <p className="font-type-menu ">General</p>

                </div>

                {/* <div

                className="btn-menu-icon-placeholder"

                style={{ scale: "0.95" }}

              >

             

                <IcoResults />

              </div> */}

              </button>



              <button

                className="btn-menu dropdown-menu-btn"

                onClick={() => handleClick("dashboard-forensics")}

                disabled={visblePage === "dashboard-forensics"}

              >

                <div className="display-flex">

                  {/* <IcoDownload

                  className="btn-menu-icon-placeholder  mr-a "

                  style={{ visibility: "hidden" }}

                /> */}

                  <p className="font-type-menu ">Forensics</p>

                </div>

                {/* <div

                className="btn-menu-icon-placeholder"

                style={{ scale: "0.95" }}

              >

                <IcoResults />

              </div> */}

              </button>



              <button

                className="btn-menu dropdown-menu-btn"

                onClick={() => handleClick("dashboard-threat-hunting")}

                disabled={visblePage === "dashboard-threat-hunting"}

              >

                <div className="display-flex">

                  {/* <IcoDownload

                  className="btn-menu-icon-placeholder  mr-a "

                  style={{ visibility: "hidden" }}

                /> */}

                  <p className="font-type-menu ">Threat Hunting</p>

                </div>

                {/* <div

                className="btn-menu-icon-placeholder"

                style={{ scale: "0.95" }}

              >

                <IcoResults />

              </div> */}

              </button>



              <button

                className="btn-menu dropdown-menu-btn"

                onClick={() => handleClick("dashboard-cti")}

                disabled={visblePage === "dashboard-cti"}

              >

                <div className="display-flex">

                  {/* <IcoDownload

                  className="btn-menu-icon-placeholder  mr-a "

                  style={{ visibility: "hidden" }}

                /> */}

                  <p className="font-type-menu ">Cyber Threat Intelligence</p>

                </div>

                {/* <div

                className="btn-menu-icon-placeholder"

                style={{ scale: "0.95" }}

              >

                <IcoResults />

              </div> */}

              </button>

              {/* Cyber Threat Intelligence

        ASM     Attack Surface Management */}

              <button

                className="btn-menu dropdown-menu-btn"

                onClick={() => handleClick("dashboard-asm")}

                disabled={visblePage === "dashboard-asm"}

              >

                <div className="display-flex">

                  {/* <IcoDownload

                  className="btn-menu-icon-placeholder  mr-a "

                  style={{ visibility: "hidden" }}

                /> */}

                  <p className="font-type-menu ">Attack Surface Management</p>

                </div>

                {/* <div

                className="btn-menu-icon-placeholder"

                style={{ scale: "0.95" }}

              >

                <IcoResults />

              </div> */}

              </button>



              {/* <button

                className="btn-menu dropdown-menu-btn"

                onClick={() => handleNewWindow("2001000")}

                disabled={visblePage === "dashboard-risx"}

              >

                <div className="display-flex">



                  <p className="font-type-menu ">Active Directory</p>

                </div>

              </button> */}



              <button

                className="btn-menu dropdown-menu-btn"

                onClick={() =>

                  handleClick("dashboard-vulnerability-management")

                }

                disabled={visblePage === "dashboard-vulnerability-management"}

              >

                <div className="display-flex">

                  <p className="font-type-menu ">Vulnerability Management</p>

                </div>

              </button>

            </div>

          </div>



          {/* ..........Dashboards..........end. */}



          <button

            className={`btn-menu  ${

              visblePage === "assets" && "btn_look_hover"

            }`}

            //  className="btn-menu"

            onClick={() => {

              handleClick("assets");

              set_Assets_Preview_List(false);

            }}

            disabled={visblePage === "assets" && Assets_Preview_List === false}

          >

            {/* className="btn-type2" */}



            <div className="display-flex">

              <IcoResourceGroup className="btn-menu-icon-placeholder  mr-a " />

              <p className="font-type-menu ">Assets</p>

            </div>

            <div className="btn-menu-icon-placeholder  ">

              {" "}

              {/*  <MenuArrowDown  />*/}

            </div>

          </button>



          <div

            onMouseLeave={() => {

              setDropDownAlerts(false);

            }}

            onMouseEnter={() => {

              setDropDownAlerts(true);

            }}

          >

            <button

              className="btn-menu  "

              onClick={() => handleClick("Alerts")}

              // onClick={() => handleClickComingSoon("Alerts")}

              disabled={visblePage === "Alerts"}

            >

              <div className="display-flex">

                <IconAlert className="btn-menu-icon-placeholder  mr-a " />

                <p className="font-type-menu ">Alerts</p>



                {/* <div className="notification"><p className="font-type-very-sml-txt   Color-White">{unseen_alert_number ||  unseen_alert_number != 0 &&   unseen_alert_number}</p></div> */}

                {/* <div

              className={`Bg-Red  light-bulb-type2 `}

              style={{ marginLeft: "2px", marginBottom: "12px" }}

            /> */}

              </div>

              <div className="btn-menu-icon-placeholder  "> </div>

            </button>

          </div>



<button

  className="btn-menu"

  onClick={() => handleClick("Inventory")}

  disabled={visblePage === "Inventory"}

>

  <div className="display-flex">

    <IconAlert className="btn-menu-icon-placeholder  mr-a " />

    <p className="font-type-menu ">Inventory</p>

  </div>

  <div className="btn-menu-icon-placeholder  "> </div>

</button> 



<button

  className="btn-menu"

  onClick={() => handleClick("Compliance")}

  disabled={visblePage === "Compliance"}

>

  <div className="display-flex">

    <IconAlert className="btn-menu-icon-placeholder  mr-a " />

    <p className="font-type-menu ">Compliance</p>

  </div>

  <div className="btn-menu-icon-placeholder  "> </div>

</button> 


<button

  className="btn-menu"

  onClick={() => handleClick("Responder")}

  disabled={visblePage === "Responder"}

>

  <div className="display-flex">

    <IconAlert className="btn-menu-icon-placeholder  mr-a " />

    <p className="font-type-menu ">Responder</p>

  </div>

  <div className="btn-menu-icon-placeholder  "> </div>

</button> 


          {/* <button

            className="btn-menu  "

            onClick={() => handleClick("OPVelociraptor")}

            disabled={visblePage === "OPVelociraptor"}

          >

            <div className="display-flex">

              <IcoSettings className="btn-menu-icon-placeholder  mr-a " />

              <p className="font-type-menu ">On-Premise Velociraptor</p>

            </div>

            <div className="btn-menu-icon-placeholder  ">

              {" "}

            </div>

          </button> */}



          <button

            className="btn-menu  "

            onClick={() => handleClick("Settings")}

            disabled={visblePage === "Settings"}

          >

            <div className="display-flex">

              <IcoSettings className="btn-menu-icon-placeholder  mr-a " />

              <p className="font-type-menu ">Settings</p>

            </div>

            <div className="btn-menu-icon-placeholder  ">

              {" "}

              {/*  <MenuArrowDown  />*/}

            </div>

          </button>



          {/* <button

          className="btn-menu  "

          onClick={() => handleClick("Users")}

          disabled={visblePage === "Users"}

        >

          <div className="display-flex">

            <IconUsers className="btn-menu-icon-placeholder  mr-a " />

            <p className="font-type-menu ">Users</p>

          </div>

          <div className="btn-menu-icon-placeholder  ">

            {" "}

         

          </div>

        </button> */}



          <div

            className="btn-menu-list"

            onMouseLeave={() => setDownloadAllAgentsDrop(false)}

            //  onMouseEnter={()=>set_download_drop_down(true)}

          >

            {" "}

            <button

              className={`btn-menu  ${

                download_drop_down ? "btn_look_hover" : ""

              } `}

              onClick={() => {

                setDownloadAllAgentsDrop(!DownloadAllAgentsDrop);

              }}

            >

              <div className="display-flex">

                <IcoDownload className="btn-menu-icon-placeholder  mr-a " />

                <p className="font-type-menu ">Download Agent</p>

              </div>

              <div className="btn-menu-icon-placeholder  ">

                {" "}

                {/*  <MenuArrowDown  />*/}

              </div>

            </button>

            <div

              className={`dropdown-menu ${DownloadAllAgentsDrop ? "open" : ""}`}

            >

              <div

                className="btn-menu-list"

                onMouseLeave={() => set_download_drop_down(false)}

                //  onMouseEnter={()=>set_download_drop_down(true)}

              >

                <button

                  className={`btn-menu  ${

                    download_drop_down ? "btn_look_hover" : ""

                  } `}

                  onClick={handle_download_drop_down}

                >

                  <div className="display-flex">

                    <IcoDownload

                      className="btn-menu-icon-placeholder  mr-a "

                      style={{ visibility: "hidden" }}

                    />

                    <p className="font-type-menu ">Online</p>

                  </div>

                  <div className="btn-menu-icon-placeholder  ">

                    {" "}

                    {/*  <MenuArrowDown  />*/}

                  </div>

                </button>

                {/* fix */}

                <div

                  className={`dropdown-menu-Sub ${

                    download_drop_down ? "open" : ""

                  }`}

                >

                  <button

                    className="btn-menu  "

                    onClick={(e) => {

                      handleDownload("Windows");

                    }}

                  >

                    <div className="display-flex">

                      <IcoDownload

                        className="btn-menu-icon-placeholder  mr-a "

                        style={{ visibility: "hidden" }}

                      />

                      <p className="font-type-menu ">Windows</p>

                    </div>

                    <div className="btn-menu-icon-placeholder  ">

                      {" "}

                      {/*  <MenuArrowDown  />*/}

                    </div>

                  </button>



                  <button

                    className="btn-menu  "

                    onClick={(e) => {

                      handleDownload("Linux");

                    }}

                  >

                    <div className="display-flex">

                      <IcoDownload

                        className="btn-menu-icon-placeholder  mr-a "

                        style={{ visibility: "hidden" }}

                      />

                      <p className="font-type-menu ">Linux</p>

                    </div>

                    <div className="btn-menu-icon-placeholder  ">

                      {" "}

                      {/*  <MenuArrowDown  />*/}

                    </div>

                  </button>



                  <button

                    className="btn-menu  "

                    onClick={(e) => {

                      handleDownload("Mac");

                    }}

                  >

                    <div className="display-flex">

                      <IcoDownload

                        className="btn-menu-icon-placeholder  mr-a "

                        style={{ visibility: "hidden" }}

                      />

                      <p className="font-type-menu ">Mac</p>

                    </div>

                    <div className="btn-menu-icon-placeholder  ">

                      {" "}

                      {/*  <MenuArrowDown  />*/}

                    </div>

                  </button>

                </div>

              </div>



              <div

                className="btn-menu-list"

                onMouseLeave={() => setVeloDropDownStepOne(false)}

                //  onMouseEnter={()=>set_download_drop_down(true)}

              >

                <button

                  className={`btn-menu  ${

                    VeloDropDownStepOne ? "btn_look_hover" : ""

                  } `}

                  onClick={HandleVeloDropDownStepOne}

                >

                  <div className="display-flex">

                    <IcoDownload

                      className="btn-menu-icon-placeholder  mr-a "

                      style={{ visibility: "hidden" }}

                    />

                    <p className="font-type-menu ">Offline</p>

                  </div>

                  <div className="btn-menu-icon-placeholder  ">

                    {" "}

                    {/*  <MenuArrowDown  />*/}

                  </div>

                </button>

                {/* fix */}

                <div

                  className={`dropdown-menu-Sub ${

                    VeloDropDownStepOne ? "open" : ""

                  }`}

                >

                  {VelociraptorCollectorsList?.map((x) => {

                    return (

                      <div

                        onMouseLeave={() => {

                          console.log(

                            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"

                          );



                          setOpenVeloCollectorList(

                            OpenVeloCollectorList?.filter(

                              (yy) => yy != x?.config_id

                            )

                          );

                        }}

                      >

                        <button

                          className="btn-menu  "

                          onClick={() => {

                            HandleVeloClickOne(x?.config_id);

                          }}

                        >

                          <div className="display-flex">

                            <IcoDownload

                              className="btn-menu-icon-placeholder  mr-a "

                              style={{ visibility: "hidden" }}

                            />

                            <p className="font-type-menu ">{x?.config_name}</p>

                          </div>

                          <div className="btn-menu-icon-placeholder  ">

                            {" "}

                            {/*  <MenuArrowDown  />*/}

                          </div>

                        </button>

                        <div

                          className={`dropdown-menu-Sub ${

                            OpenVeloCollectorList.includes(x?.config_id)

                              ? "open"

                              : ""

                          }`}

                        >

                          <button

                            className="btn-menu  "

                            onClick={(e) => {

                              e.preventDefault();

                              HandleVeloClickTwo(

                                x?.config_id,

                                "Windows",

                                x?.config_name

                              );

                            }}

                          >

                            <div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />

                              <p className="font-type-menu ">Windows</p>

                            </div>

                            <div className="btn-menu-icon-placeholder  ">

                              {" "}

                              {/*  <MenuArrowDown  />*/}

                            </div>

                          </button>



                          <button

                            className="btn-menu  "

                            onClick={(e) => {

                              e.preventDefault();

                              HandleVeloClickTwo(

                                x?.config_id,

                                "Linux",

                                x?.config_name

                              );

                            }}

                          >

                            <div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />

                              <p className="font-type-menu ">Linux</p>

                            </div>

                            <div className="btn-menu-icon-placeholder  ">

                              {" "}

                              {/*  <MenuArrowDown  />*/}

                            </div>

                          </button>



                          <button

                            className="btn-menu  "

                            onClick={(e) => {

                              e.preventDefault();

                              HandleVeloClickTwo(

                                x?.config_id,

                                "Mac",

                                x?.config_name

                              );

                            }}

                          >

                            <div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />

                              <p className="font-type-menu ">Mac</p>

                            </div>

                            <div className="btn-menu-icon-placeholder  ">

                              {" "}

                              {/*  <MenuArrowDown  />*/}

                            </div>

                          </button>

                        </div>

                      </div>

                    );

                  })}

                </div>


              </div>

            </div>
{/* New "Download XDR Agent" Button */}
<button
  className={`btn-menu ${DownloadXDRDropDown ? "btn_look_hover" : ""}`}
  onClick={handleToggleXDRDropDown}
>
  <div className="display-flex">
    <IcoDownload className="btn-menu-icon-placeholder mr-a" />
    <p className="font-type-menu">Download XDR Agent</p>
  </div>
</button>
<div className={`dropdown-menu ${DownloadXDRDropDown ? "open" : ""}`}>
  {/* Online Dropdown */}
  <div
    className="btn-menu-list"
    onMouseLeave={() => setDownloadXDROnlineDrop(false)}
  >
    <button
      className={`btn-menu ${DownloadXDROnlineDrop ? "btn_look_hover" : ""}`}
      onClick={() => setDownloadXDROnlineDrop(!DownloadXDROnlineDrop)}
    >
      <div className="display-flex">
        <IcoDownload

                      className="btn-menu-icon-placeholder  mr-a "

                      style={{ visibility: "hidden" }}

                    />
        <p className="font-type-menu">Install Agent </p>
      </div>
    </button>
    <div className={`dropdown-menu-Sub ${DownloadXDROnlineDrop ? "open" : ""}`}>
      <button
        className="btn-menu"
        onClick={() => handleDownloadXDR("Windows", "Online")}
      >
<div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />


                       
        <p className="font-type-menu">Install Windows Agent</p>
     </div>
                            <div className="btn-menu-icon-placeholder  ">
							
							</div>

							</button>
      <button
        className="btn-menu"
        onClick={() => handleDownloadXDR("Linux", "Online")}
      >
<div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />


                           
        <p className="font-type-menu">Install linux Agent</p>
 </div>
                            <div className="btn-menu-icon-placeholder  ">
							
							</div> 
							</button>
      <button
        className="btn-menu"
        onClick={() => handleDownloadXDR("Mac", "Online")}
      >
<div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />


                           
        <p className="font-type-menu">Install Mac Agent</p>
 </div>
                            <div className="btn-menu-icon-placeholder  ">
							
							</div>
   
      </button>
    </div>
  </div>

  {/* Offline Dropdown */}
  <div
    className="btn-menu-list"
    onMouseLeave={() => setDownloadXDROfflineDrop(false)}
  >
    <button
      className={`btn-menu ${DownloadXDROfflineDrop ? "btn_look_hover" : ""}`}
      onClick={() => setDownloadXDROfflineDrop(!DownloadXDROfflineDrop)}
    >
      <div className="display-flex">
        <IcoDownload

                      className="btn-menu-icon-placeholder  mr-a "

                      style={{ visibility: "hidden" }}

                    />
        <p className="font-type-menu">Uninstall Agent</p>
      </div>
    </button>
    <div
      className={`dropdown-menu-Sub ${DownloadXDROfflineDrop ? "open" : ""}`}
    >
      <button
        className="btn-menu"
        onClick={() => handleDownloadXDR("Light", "Offline")}
      >
<div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />


                            
							        <p className="font-type-menu">Uninstall Windows Agent</p>
 </div>

                            <div className="btn-menu-icon-placeholder  ">
							
  
   </div>
      </button>
      <button
        className="btn-menu"
        onClick={() => handleDownloadXDR("Best-Practice", "Offline")}
      >
<div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />


                            
							<p className="font-type-menu">Uninstall Linux Agent</p>
 </div>
                            <div className="btn-menu-icon-placeholder  ">
							
							</div>
							</button>
      <button
        className="btn-menu"
        onClick={() => handleDownloadXDR("new_Best-Practice", "Offline")}
      >
<div className="display-flex">

                              <IcoDownload

                                className="btn-menu-icon-placeholder  mr-a "

                                style={{ visibility: "hidden" }}

                              />


                           
        <p className="font-type-menu">Uninstall MAC Agent</p>
 </div>
                            <div className="btn-menu-icon-placeholder  ">
							
							</div>
							</button>
    </div>
  </div>
</div>


          </div>{/* End of Button menu container */}


{/* XDR Download Progress Section */}
{Object.keys(XDRDownloadProgressBar).length > 0 && (
  <>
    <div
      style={{
        paddingRight: "calc(var(--space-c) + var(--space-b))",
        paddingLeft: "calc(var(--space-c) + var(--space-b))",
        bottom: "var(--space-c)",
        width: "-webkit-fill-available",
      }}
    >
      <p className="font-type-menu  Color-Grey1">
        XDR Downloads Progress:
      </p>
      <div
        style={{
          maxHeight: 180,
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div style={{ width: "100%" }}>
          {Object.keys(XDRDownloadProgressBar).map((item) => (
            <XDRDownloadProgressBarItem
              key={item}
              item={XDRDownloadProgressBar[item]}
              itemKey={item}
              XDRDownloadProgressBar={XDRDownloadProgressBar}
              setXDRDownloadProgressBar={setXDRDownloadProgressBar}
            />
          ))}
        </div>
      </div>
    </div>
  </>
)}



        </div>



        {visblePage === "Modules" && (

          <>

            <div

              className="Bg-Grey2"

              style={{ width: "100%", height: "2px", borderRadius: "5px" }}

            />

            <button

              className="btn-type2"

              onClick={() => set_PopUp_Confirm_Run_selected__show(true)}

              style={{ width: "100%", paddingLeft: "var(--space-a)" }}

            >

              <div style={{ display: "flex", alignItems: "center" }}>

                <IcoACtiveBlue style={{ marginRight: "var(--space-a)" }} />

                <p className="font-type-menu">Run Selected Jobs</p>

              </div>

            </button>

          </>

        )}

        {/* {visblePage === "alerts" && (

          <>

            <div

              className="Bg-Grey2"

              style={{ width: "100%", height: "2px", borderRadius: "5px" }}

            />

            <button

              className="btn-type2"

              onClick={async () => {

                console.log("Turn ON Alerts");

                const res = await axios.post(

                  `${backEndURL}/Alerts/UpdateAlertState`,

                  {

                    bool: !TurnOnAlerts,

                  }

                );

                setTurnOnAlerts(!TurnOnAlerts);

              }}

              style={{ width: "100%", paddingLeft: "var(--space-a)" }}

            >

              <div style={{ display: "flex", alignItems: "center" }}>

                <IcoACtiveBlue style={{ marginRight: "var(--space-a)" }} />

                <p className="font-type-menu">

                  {TurnOnAlerts ? "Disable" : "Enable"} Timestomping Alerts

                </p>

              </div>

            </button>

          </>

        )} */}

		{visblePage === "inventory" && (

  <>

    <div

      className="Bg-Grey2"

      style={{ width: "100%", height: "2px", borderRadius: "5px" }}

    />

    <button

      className="btn-type2"

      onClick={async () => {

        console.log("Update Inventory");

        const res = await axios.post(

          `${backEndURL}/Inventory/UpdateInventoryData`

        );

        if (res.data.msg === "Inventory data updated successfully") {

          set_PopUp_All_Good__txt({

            HeadLine: "Success",

            paragraph: "Inventory data updated successfully",

            buttonTitle: "Close",

          });

          set_PopUp_All_Good__show(false);

        } else {

          set_PopUp_Error____txt({

            HeadLine: "Error",

            paragraph: "Error updating inventory data",

            buttonTitle: "Close",

          });

          set_PopUp_Error____show(true);

        }

      }}

      style={{ width: "100%", paddingLeft: "var(--space-a)" }}

    >

      <div style={{ display: "flex", alignItems: "center" }}>

        <IcoACtiveBlue style={{ marginRight: "var(--space-a)" }} />

        <p className="font-type-menu">Update Inventory</p>

      </div>

    </button>

  </>

)}





{visblePage === "Compliance" && (

  <>

    <div

      className="Bg-Grey2"

      style={{ width: "100%", height: "2px", borderRadius: "5px" }}

    />



  </>

)}


{visblePage === "Responder" && (

  <>

    <div

      className="Bg-Grey2"

      style={{ width: "100%", height: "2px", borderRadius: "5px" }}

    />



  </>

)}



        {Object.keys(DownloadProgressBar).length > 0 && (

          <>

            <div

              style={{

                paddingRight: "calc(var(--space-c) + var(--space-b))",

                paddingLeft: "calc(var(--space-c) + var(--space-b))",

                // width: '100%',

                // position: "fixed", // Use fixed positioning

                bottom: "var(--space-c)", // Position it at the bottom of the viewport

                width: "-webkit-fill-available",

              }}

            >

              <p className="font-type-menu  Color-Grey1  ">

                Downloads Progress:

              </p>{" "}

              <div

                style={{

                  maxHeight: 180,

                  overflowY: "auto",

                  scrollbarWidth: "none",

                }}

              >

                <div className=" " style={{ width: "100% " }}>

                  {Object.keys(DownloadProgressBar).map((item) => (

                    <DownloadProgressBarItem

                      item={DownloadProgressBar[item]}

                      itemKey={item}

                      DownloadProgressBar={DownloadProgressBar}

                      setDownloadProgressBar={setDownloadProgressBar}

                    />

                  ))}

                </div>

              </div>

            </div>

          </>

        )}

        {Object.keys(UploadProgressBar).length > 0 && (

          <>

            <div

              style={{

                paddingRight: "calc(var(--space-c) + var(--space-b))",

                paddingLeft: "calc(var(--space-c) + var(--space-b))",

                // width: '100%',

                // position: "fixed", // Use fixed positioning

                bottom: "var(--space-c)", // Position it at the bottom of the viewport

                width: "-webkit-fill-available",

              }}

            >

              <p className="font-type-menu  Color-Grey1  ">Upload Progress:</p>{" "}

              <div

                style={{

                  maxHeight: 180,

                  overflowY: "auto",

                  scrollbarWidth: "none",

                }}

              >

                <div className=" " style={{ width: "100% " }}>

                  {Object.keys(UploadProgressBar).map((item) => (

                    <DownloadProgressBarItem

                      item={UploadProgressBar[item]}

                      itemKey={item}

                      DownloadProgressBar={UploadProgressBar}

                      setDownloadProgressBar={setUploadProgressBar}

                    />

                  ))}

                </div>

              </div>

            </div>

          </>

        )}

        <div

          style={{

            paddingRight: "calc(var(--space-c) + var(--space-b))",

            paddingLeft: "calc(var(--space-c) + var(--space-b))",

            // width: '100%',

            position: "fixed", // Use fixed positioning

            bottom: 0, // Position it at the bottom of the viewport

            width: "-webkit-fill-available",

            backgroundColor: "var(--color-Grey5)",

            paddingTop: 10,

            paddingBottom: 10,

          }}

        >

          <p

            style={{ textAlign: "center" }}

            className="font-type-menu  Color-Grey1 "

          >

            Version : 0.8.7

          </p>

        </div>

      </div>

    </>

  );

};



const MobileTopBar = ({ visblePage, set_visblePage }) => {

  const navigate = useNavigate();

  const [user_name, set_user_name] = useState("user");

  const {

    backEndURL,

    moduleLinks,

    front_IP,

    DownloadProgressBar,

    setDownloadProgressBar,

    setDownloadList,

    set_Assets_Preview_List,

    Assets_Preview_List,

    // front_URL,

    // mssp_config_json,

    // user_id,

  } = useContext(GeneralContext);



  const [PopUp_Error____show, set_PopUp_Error____show] = useState(false);

  const [PopUp_Error____txt, set_PopUp_Error____txt] = useState({

    HeadLine: "",

    paragraph: "",

    buttonTitle: "",

  });



  const [PopUp_All_Good__show, set_PopUp_All_Good__show] = useState(false);

  const [PopUp_All_Good__txt, set_PopUp_All_Good__txt] = useState({

    HeadLine: "Success",

    paragraph: "successfully",

    buttonTitle: "Close",

  });



  const [PopUp_Under_Construction__show, set_PopUp_Under_Construction__show] =

    useState(false);

  const [PopUp_Under_Construction__txt, set_PopUp_Under_Construction__txt] =

    useState({

      HeadLine: "Coming Soon!",

      paragraph:

        "We are working on creating this section. Stay tuned for updates as we finalize the details.",

      buttonTitle: "Close",

    });



  const [

    PopUp_Confirm_Run_selected__show,

    set_PopUp_Confirm_Run_selected__show,

  ] = useState(false);



  const [download_drop_down, set_download_drop_down] = useState(false);

  const [Dashboards_drop_down, set_Dashboards_drop_down] = useState(false);



  const [object, setObject] = useState({});



  const get_config = async () => {

    if (backEndURL === undefined) {

      return;

    }

    try {

      const res = await axios.get(`${backEndURL}/config`);



      if (res) {

        console.log("get_config", res.data);

      }

      setObject(res.data);

    } catch (err) {

      console.log(err);

    }

  };



  useEffect(() => {

    if (backEndURL) {

      get_config();

    }

  }, [backEndURL]);



  const handleClick = (page_name) => {

    set_visblePage(page_name);

    localStorage.setItem("visiblePage", page_name); // Store current page in localStorage

    navigate(`/${page_name.toLowerCase()}`); // This navigates to the path specified by page_name\

  };



  const handleNewWindow = (dashboard_name) => {

    const url = Make_url_from_id(dashboard_name, moduleLinks, front_IP);

    console.log("handleNewWindow url - ", url);



    if (url) {

      window.open(url, "_blank");

    }

  };



  const handle_Dashboards_drop_down = () => {

    set_Dashboards_drop_down(!Dashboards_drop_down);

  };



  const handle_download_drop_down = () => {

    set_download_drop_down(!download_drop_down);

  };



  const handleDownload = async (os) => {

    console.log("os", os);

    // window.open(object?.General?.AgentLinks[os]);

    try {

      set_PopUp_All_Good__txt({

        HeadLine: `Download ${os} Agent Start`,

        paragraph:

          "This download can take a few minutes. The file will appear in your download folder once the process is complete.",

        buttonTitle: "Close",

      });

      // set_PopUp_All_Good__show(false);

      const fileName = object?.General?.AgentLinks[os]?.split("/")?.pop();

      const fileName2 =

        object?.General?.AgentLinks[os]?.split("/")?.pop() + Math.random();




      const res = await axios.post(

        `${backEndURL}/config/DownloadAgent`,

        {

          PathOs: object?.General?.AgentLinks[os],

        },

        {

          responseType: "blob",

          onDownloadProgress: (prog) => {

            const value = Math.round((prog.loaded / prog.total ?? 1) * 100);

            if (!DownloadProgressBar[fileName2]) {

              console.log("empty 222222222222222222222222222222");

              // const copy = DownloadList.map((x) => x);

              // copy.push(fileName);

              // console.log(

              //   "DownloadListDownloadListDownloadListDownloadListDownloadListDownloadListDownloadListDownloadListDownloadList",

              //   DownloadList

              // );

              // setDownloadList(copy);

              if (value < 100) {

                DownloadProgressBar[fileName2] = {

                  progress: value,

                  fileName: fileName,

                };

              }

            }



            if (

              (DownloadProgressBar[fileName2]?.progress + 5 < value ||

                (value >= 100 &&

                  DownloadProgressBar[fileName2]?.progress != 100)) &&

              DownloadProgressBar[fileName2]?.progress !== undefined

            ) {

              console.log("Download Prog ", value, DownloadProgressBar);

              DownloadProgressBar[fileName2] = {

                progress: value,

                fileName: fileName,

              };

              setDownloadProgressBar(DownloadProgressBar);

              setDownloadList(Math.random());

            }

          },

        }

      );



      if (res) {

        // console.log("ssssssssssssssssssssssss", fileName);

        const url = window.URL.createObjectURL(res.data);

        console.log(url);



        // window.open(url)

        // console.log(fileName, "zzzzzzzzzzzzzzzzzzzzzzzzzzzz");

        var link = document.createElement("a");

        link.href = url;

        link.download = fileName;

        link.click();

      }

    } catch (err) {

      console.log(err);

      set_PopUp_Error____txt({

        HeadLine: "Error in Download",

        paragraph: `there was an error downloading the file : ${err}`,

        buttonTitle: "Close",

      });

      set_PopUp_Error____show(true);

    }

  };



  const handle_click_user = async () => {

    set_PopUp_Error____txt({

      HeadLine: "Work in Progress..",

      paragraph:

        "Final touches underway; anticipate completion shortly. Stay tuned for updates.",

      buttonTitle: "Close",

    });

    set_PopUp_Error____show(true);

  };



  const handle_active_manual_process = async () => {

    set_PopUp_Confirm_Run_selected__show(false);

    console.log("handle_active_manual_process");

    try {

      const res = await axios.get(

        `${backEndURL}/process/active-manual-process`,

        { params: { param1: "param1value" } }

      );



      if (res.data) {

        console.log("handle_active_manual_process - data", res?.data);

        console.log("handle_active_manual_process - status", res?.status);

        if (res?.data?.success === true) {

          console.log(

            "A Manual Process has Started to run",

            "message;",

            res?.data?.message

          );

          set_PopUp_All_Good__txt({

            HeadLine: "Activated",

            paragraph: "A Manual Process has Started to run",

            // paragraph: res?.data?.message,

            buttonTitle: "Close",

          });

          set_PopUp_All_Good__show(false);

        } else {

          set_PopUp_Error____txt({

            HeadLine: "Error",

            paragraph: `${res?.data?.message}`,

            buttonTitle: "Close",

          });

          set_PopUp_Error____show(true);

        }

      }

    } catch (err) {

      set_PopUp_Error____txt({

        HeadLine: "Error",

        paragraph: `${err?.response?.data?.message}`,

        buttonTitle: "Close",

      });

      set_PopUp_Error____show(true);

      console.log(

        "catch handle_active_manual_process - data",

        err?.response?.data

      );

      // console.log("catch handle_active_manual_process - error", err?.response?.data?.error);

      // console.log("catch handle_active_manual_process - message", err?.response?.data?.message);

      // console.log("catch handle_active_manual_process - success", err?.response?.data?.success);

      console.log(err);

    }

  };



  const handle_cancel_active_manual_process = () => {

    console.log("handle_cancel_active_manual_process item...");

    set_PopUp_Confirm_Run_selected__show(false);

  };



  useEffect(() => {

    const name = localStorage.getItem("username");



    if (name) {

      set_user_name(name);

    } else {

      console.log("No username found in local storage.");

    }

  }, []);



  return (

    <div className="top-bar-mobile-out">

      {/* 

{PopUp_Confirm_Run_selected__show &&

      <PopUp_Confirm_Run_selected

      popUp_show={PopUp_Confirm_Run_selected__show}

      set_popUp_show={set_PopUp_Confirm_Run_selected__show}

     True_action={handle_active_manual_process}

     False_action={handle_cancel_active_manual_process}

      /> }



      {PopUp_Under_Construction__show && (

        <PopUp_Under_Construction

          popUp_show={PopUp_Under_Construction__show}

          set_popUp_show={set_PopUp_Under_Construction__show}

          HeadLine={PopUp_Under_Construction__txt.HeadLine}

          paragraph={PopUp_Under_Construction__txt.paragraph}

          buttonTitle={PopUp_Under_Construction__txt.buttonTitle}

        />

      )}



      {PopUp_All_Good__show && (

        <PopUp_All_Good

          popUp_show={PopUp_All_Good__show}

          set_popUp_show={set_PopUp_All_Good__show}

          HeadLine={PopUp_All_Good__txt.HeadLine}

          paragraph={PopUp_All_Good__txt.paragraph}

          buttonTitle={PopUp_All_Good__txt.buttonTitle}

        />

      )}



      {PopUp_Error____show && (

        <PopUp_Error

          popUp_show={PopUp_Error____show}

          set_popUp_show={set_PopUp_Error____show}

          HeadLine={PopUp_Error____txt.HeadLine}

          paragraph={PopUp_Error____txt.paragraph}

          buttonTitle={PopUp_Error____txt.buttonTitle}

        />

      )} */}



      <div

        style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          height: "52px",

        }}

      >

        <RisxMsspLogoWide className=" " />

        {/* <div style={{backgroundColor:"red" , height:"22px", width:"22px"}}></div> */}

      </div>

    </div>

  );

};



export { SideBar, MobileTopBar };