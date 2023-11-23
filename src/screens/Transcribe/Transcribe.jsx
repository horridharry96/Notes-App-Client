import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";

// COMPONENTS
import { Loader } from "../../components";

// CONTEXT
import { useStateContext } from "../../context";

export default function Transcribe() {
  const lottieRef = useRef(null);
  const navigation = useNavigation();
  const { setTranscript } = useStateContext();
  //   console.log("FROM CONTEXT: ", transcript);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = React.useState();
  const [recordingIntervalId, setRecordingIntervalId] = useState();
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = React.useState([]);
  const [message, setMessage] = React.useState("");

  const handleRecording = () => {
    if (isRecording) {
      stopRecording();
      lottieRef.current?.reset();
    } else {
      startRecording();
      lottieRef.current?.play();
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    // Optional: You may want to reset the animation when the component unmounts
    return () => {
      lottieRef.current?.reset();
    };
  }, []);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Update recording duration every second
        const intervalId = setInterval(() => {
          setRecordingDuration((prevDuration) => prevDuration + 1);
        }, 1000);

        // Save the intervalId to clear it later
        setRecordingIntervalId(intervalId);
        const { recording } = await Audio.Recording.createAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );

        setRecording(recording);
      } else {
        setMessage("Please grant permission to app to access microphone");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    // Clear the interval that updates the recording duration
    clearInterval(recordingIntervalId);
    setRecordingDuration(0);

    let updatedRecordings = [...recordings];
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    updatedRecordings.push({
      sound: sound,
      duration: getDurationFormatted(status.durationMillis),
      file: recording.getURI(),
    });
    const recordingUri = recording.getURI();
    console.log("URI: ", recordingUri);
    setRecordings(updatedRecordings);
  }

  function getDurationFormatted(millis) {
    const minutes = millis / 1000 / 60;
    const minutesDisplay = Math.floor(minutes);
    const seconds = Math.round((minutes - minutesDisplay) * 60);
    const secondsDisplay = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutesDisplay}:${secondsDisplay}`;
  }

  const getFileExtension = (fileUri) => {
    const matches = fileUri.match(/\.([a-zA-Z0-9]+)$/);

    if (matches && matches.length > 1) {
      return matches[1];
    }

    return null;
  };

  const handleTranscribe = async (record) => {
    // console.log(record);
    // console.log(record.file);
    const fileExtension = getFileExtension(record.file);
    if (fileExtension) {
      //   console.log("File extension:", fileExtension);
    } else {
      console.log("File extension not found.");
    }

    const formData = new FormData();
    formData.append("file", {
      uri: record.file,
      type: `audio/${fileExtension}`, // Adjust the file type as needed
      name: `${Date.now()}.${fileExtension}`,
    });

    try {
      setIsTranscribing(true);
      const { data } = await axios.post(
        "https://notesappserver-dev-emhk.4.us-1.fl0.io/api/transcribe/create", //PRODUCTION URL
        // "http://192.168.10.4:8080/api/transcribe/create", // DEV URL
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      //   console.log(data);
      setTranscript(data);
      setIsTranscribing(false);
      navigation.navigate("SummarizedNotes");
    } catch (error) {
      console.log(error.response.data);
      setIsTranscribing(false);
    }
  };

  function getRecordingLines() {
    return recordings.map((recordingLine, index) => {
      return (
        <View
          key={index}
          onPress={() => console.log(recordingLine.file)}
          style={{ width: "100%", marginHorizontal: "3%" }}
        >
          <View style={styles.row}>
            <Text style={styles.fill}>
              Recording {index + 1} - {recordingLine.duration}
            </Text>
            <TouchableOpacity
              style={styles.smallbutton}
              onPress={() => recordingLine.sound.replayAsync()}
            >
              <Text style={styles.smallbuttonText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallbutton}
              onPress={() => handleTranscribe(recordingLine)}
            >
              <Text style={styles.smallbuttonText}>Summarize</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  }

  return (
    <>
      {!isTranscribing && (
        <View style={styles.container}>
          <Text>{message}</Text>
          {/* <TouchableOpacity
        style={styles.button}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity> */}
          {isRecording && (
            <Text
              style={styles.title}
            >{`Recording Duration: ${recordingDuration}s`}</Text>
          )}
          {getRecordingLines()}
          <TouchableOpacity
            onPress={() => handleRecording()}
            style={styles.recordingButton}
          >
            <LottieView
              source={require("../../../assets/Recording.json")}
              style={styles.loader}
              autoPlay={false}
              loop={false}
              ref={lottieRef}
            />
          </TouchableOpacity>
        </View>
      )}
      {isTranscribing && <Loader title={"Getting Transcription"} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    flex: 1,
    margin: 16,
  },
  button: {
    width: "70%",
    height: 50,
    borderRadius: 8,
    backgroundColor: "blue",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  smallbutton: {
    width: "20%",
    height: 35,
    borderRadius: 8,
    backgroundColor: "blue",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  smallbuttonText: {
    color: "white",
    fontSize: 12,
  },
  transcriptionStyles: {
    width: "80%",
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
  },
  loader: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 20,
  },
  recordingButton: {
    position: "absolute",
    bottom: 40,
  },
});
