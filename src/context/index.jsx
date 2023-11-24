import React, { useContext, createContext, useState } from "react";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  // STATES
  const [transcript, setTranscript] = useState("Test Transcript");
  const [summary, setSummary] = useState("Test Summary");
  const [audioFile, setAudioFile] = useState("Test Audio File");

  return (
    <StateContext.Provider
      value={{
        transcript,
        setTranscript,
        summary,
        setSummary,
        audioFile,
        setAudioFile,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
