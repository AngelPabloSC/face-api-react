import React, { useEffect, useState, useRef } from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import * as faceapi from "face-api.js";
import Header from "./components/header";
import background from "./assets/img/patron.png";

const App = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detections, setDetections] = useState([]);
  const [lastDetection, setLastDetection] = useState({
    age: null,
    gender: null,
  });
  const [labeledDescriptor, setLabeledDescriptor] = useState(null); // Descriptor facial etiquetado
  const [matchFound, setMatchFound] = useState(false); // Resultado de la comparación
  const videoRef = useRef(null); // Referencia al elemento video
  const canvasRef = useRef(null); // Referencia al lienzo (canvas) para dibujar detecciones

  // Cargar los modelos de Face-api.js
  const loadModels = async () => {
    const MODEL_URL = "/models";
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (error) {
      console.error("Error al cargar los modelos:", error);
      alert("Hubo un problema al cargar los modelos.");
    }
  };

  useEffect(() => {
    loadModels();

    if (modelsLoaded) {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((error) => {
          console.error("Error al acceder a la cámara:", error);
          alert("No se pudo acceder a la cámara.");
        });
    }

    return () => {
      const stream = videoRef.current?.srcObject;
      const tracks = stream?.getTracks();
      tracks?.forEach((track) => track.stop());
    };
  }, [modelsLoaded]);

  const detectFacesInVideo = async () => {
    if (videoRef.current && modelsLoaded) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Ajustar dimensiones del canvas al video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Limpiar el canvas antes de dibujar
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Detectar caras en el video
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withAgeAndGender();

      let matchDetected = false;

      detections.forEach((detection) => {
        const { age, gender } = detection;
        const { x, y, width, height } = detection.detection.box;

        let label = "Desconocido";
        let color = "red";

        if (labeledDescriptor) {
          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor, 0.6);
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

          if (bestMatch.label !== "unknown") {
            label = "Coincidencia detectada";
            color = "green";
            matchDetected = true;
          }
        }

        // Dibujar el rectángulo sobre la cara en el video
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Mostrar el nombre de la persona reconocida sobre el recuadro
        ctx.fillStyle = color;
        ctx.font = "18px Arial";
        ctx.fillText(label, x, y - 5);

        // Guardar la última detección
        if (
          lastDetection.age === null ||
          lastDetection.gender === null ||
          age !== lastDetection.age ||
          gender !== lastDetection.gender
        ) {
          setTimeout(() => {
            setLastDetection({ age, gender });
          }, 100); // Retraso de 2 segundos
        }
      });

      setMatchFound(matchDetected);
      setDetections(detections);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && modelsLoaded) {
      const image = await faceapi.bufferToImage(file);
      const detections = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
          "Persona etiquetada",
          [detections.descriptor]
        );
        setLabeledDescriptor(labeledDescriptor);
        alert("Imagen procesada y descriptor facial almacenado.");
      } else {
        alert("No se detectó ninguna cara en la imagen subida.");
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(detectFacesInVideo, 3000);

    return () => clearInterval(interval);
  }, [modelsLoaded, labeledDescriptor]);

  return (
    <Container sx={{ padding: 0, margin: 0 }}>
      <Box
        sx={{
          width: "100vw",
          height: "90vh",
          background: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 2,
        }}
      >
        <Header />
        <Box sx={{ textAlign: "center", marginTop: -1 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "90%",
              marginTop: 2,
            }}
          >
            <video
              ref={videoRef}
              width="100%"
              height="100%"
              autoPlay
              muted
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none", // Para que no interfiera con el video
              }}
            />
          </Box>

          {lastDetection.age !== null && lastDetection.gender && (
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="h6">Última detección:</Typography>
              <Typography>
                Edad estimada: {Math.round(lastDetection.age)} | Género:{" "}
                {lastDetection.gender === "male" ? "Hombre" : "Mujer"}
              </Typography>
            </Box>
          )}

          {matchFound && (
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="h6" color="green">
                ¡Coincidencia encontrada con la persona !
              </Typography>
            </Box>
          )}

          <Box sx={{ marginTop: 2 }}>
            <Typography variant="h6">Subir imagen etiquetada:</Typography>
            <Button variant="contained" component="label" sx={{ marginTop: 1 }}>
              Subir imagen
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default App;
