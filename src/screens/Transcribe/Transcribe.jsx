import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
// import LottieView from "lottie-react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

// COMPONENTS
import { Loader } from "../../components";

// CONTEXT
import { useStateContext } from "../../context";

export default function Transcribe() {
  const lottieRef = useRef(null);
  const navigation = useNavigation();
  const { setTranscript, setAudioFile } = useStateContext();
  //   console.log("FROM CONTEXT: ", transcript);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = React.useState();
  const [recordingIntervalId, setRecordingIntervalId] = useState();
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = React.useState([]);
  const [message, setMessage] = React.useState("");

  //   const handleRecording = () => {
  //     if (isRecording) {
  //       stopRecording();
  //       lottieRef.current?.reset();
  //     } else {
  //       startRecording();
  //       lottieRef.current?.play();
  //     }
  //     setIsRecording(!isRecording);
  //   };

  //   useEffect(() => {
  //     // Optional: You may want to reset the animation when the component unmounts
  //     return () => {
  //       lottieRef.current?.reset();
  //     };
  //   }, []);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        setIsRecording(true);

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
    setIsRecording(false);

    // Create a new Date object
    var currentDate = new Date();

    // Get the current date
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1; // Months are zero-based
    var year = currentDate.getFullYear();

    // Get the name of the month
    var monthName = currentDate.toLocaleString("default", { month: "long" });

    // Get the day of the week
    var dayOfWeek = currentDate.getDay();
    var daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    var dayName = daysOfWeek[dayOfWeek];

    // Get the current time in AM/PM format
    var timeOptions = {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    };
    var formattedTime = currentDate.toLocaleString("en-US", timeOptions);

    // Display the current date, day, month, and time
    // console.log("Current Date: " + day + " " + monthName + " " + year);
    // console.log("Day: " + dayName);
    // console.log("Current Time: " + formattedTime);
    // console.log(
    //   `${dayName}, ${monthName.slice(0, 3)} ${day} - ${formattedTime}`
    // );

    let updatedRecordings = [...recordings];
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    updatedRecordings.push({
      sound: sound,
      duration: getDurationFormatted(status.durationMillis),
      file: recording.getURI(),
      createdAt: `${dayName}, ${monthName.slice(
        0,
        3
      )} ${day} - ${formattedTime}`,
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
    console.log(record);
    console.log(record.file);
    const fileExtension = getFileExtension(record.file);
    if (fileExtension) {
      //   console.log("File extension:", fileExtension);
    } else {
      console.log("File extension not found.");
    }
    setAudioFile(record.file);
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
        <TouchableOpacity
          key={index}
          onPress={() => handleTranscribe(recordingLine)}
          style={{ width: "100%", marginHorizontal: "3%", marginVertical: 10 }}
        >
          <TouchableOpacity
            style={styles.row}
            onPress={() => handleTranscribe(recordingLine)}
          >
            <View
              style={{
                height: 40,
                width: 40,
                borderRadius: 20,
                backgroundColor: "#808080",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="document-text-outline" size={20} color="white" />
            </View>

            <View
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: 5,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                }}
              >
                {recordingLine.createdAt}
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                }}
              >
                Note {index + 1}
              </Text>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color="white"
                />
                <Text
                  style={{
                    color: "white",
                    fontSize: 12,
                  }}
                >
                  {recordingLine.duration}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    });
  }

  const pickFile = async () => {
    try {
      const docRes = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      console.log(docRes);

      setAudioFile(docRes.assets[0].uri);
      // CREATE NOTES FROM FILE
      const formData = new FormData();
      formData.append("file", {
        uri: docRes.assets[0].uri,
        type: `audio/.mp3`, // Adjust the file type as needed
        name: `${Date.now()}.mp3`,
      });

      try {
        setIsTranscribing(true);
        const { data } = await axios.post(
          "https://notesappserver-dev-emhk.4.us-1.fl0.io/api/transcribe/filecreate", //PRODUCTION URL
          //   "http://192.168.10.4:8080/api/transcribe/filecreate", // DEV URL
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log(data);
        setTranscript(data);
        setIsTranscribing(false);
        navigation.navigate("SummarizedNotes");
      } catch (error) {
        console.log(error.response.data);
        setIsTranscribing(false);
      }
    } catch (error) {
      console.log("Error while selecting file: ", error);
    }
  };

  return (
    <>
      {!isTranscribing && (
        <SafeAreaView style={styles.container}>
          <Text style={styles.headerText}>My Conversations</Text>
          {/* <TouchableOpacity
        style={styles.button}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity> */}
          {getRecordingLines()}
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={styles.recordingButton}
          >
            {/* <LottieView
              source={require("../../../assets/Recording.json")}
              style={styles.loader}
              autoPlay={false}
              loop={false}
              ref={lottieRef}
            /> */}
            {isRecording && (
              <Text style={styles.title}>{`${recordingDuration}s`}</Text>
            )}
            <View
              style={{
                height: 50,
                width: 120,
                borderRadius: 30,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#86c7ed",
              }}
            >
              {isRecording ? (
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#1F1B24",
                      fontWeight: "500",
                    }}
                  >
                    End
                  </Text>
                  <Feather name="mic" size={16} color="#1F1B24" />
                </View>
              ) : (
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#1F1B24",
                      fontWeight: "500",
                    }}
                  >
                    Start
                  </Text>
                  <Feather name="mic-off" size={16} color="#1F1B24" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectButton} onPress={pickFile}>
            <View
              style={{
                height: 50,
                width: 120,
                borderRadius: 30,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#86c7ed",
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#1F1B24",
                    fontWeight: "500",
                  }}
                >
                  Select File
                </Text>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#1F1B24"
                />
              </View>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}
      {isTranscribing && <Loader title={"Getting Transcription"} />}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1B24",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 20,
    gap: 20,
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
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  recordingButton: {
    position: "absolute",
    bottom: 60,
    right: 30,
  },
  headerText: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
    marginVertical: 20,
  },
  selectButton: {
    position: "absolute",
    bottom: 60,
    left: 30,
  },
});
