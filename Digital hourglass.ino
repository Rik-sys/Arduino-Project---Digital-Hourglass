#include <WiFi.h>
#include <WebServer.h>
#include <FastLED.h>
#include <ArduinoJson.h>

// הגדרות WiFi 
const char* ssid = "301-18 2339";
const char* password = "069Ar&51";

// הגדרות LED Matrix
#define LED_PIN 21
#define WIDTH 8
#define HEIGHT 32
#define NUM_LEDS (WIDTH * HEIGHT)
CRGB leds[NUM_LEDS];

// הגדרות חיישני מרחק HC-SR04
#define SENSOR_COUNT 4

// פינים לחיישני מרחק (TOP, BOTTOM, LEFT, RIGHT)
#define TRIG_PIN_TOP 4
#define ECHO_PIN_TOP 2
#define TRIG_PIN_BOTTOM 5
#define ECHO_PIN_BOTTOM 18
#define TRIG_PIN_LEFT 12
#define ECHO_PIN_LEFT 13
#define TRIG_PIN_RIGHT 33
#define ECHO_PIN_RIGHT 25

// מבנה לחיישן מרחק
struct DistanceSensor {
  int trigPin;
  int echoPin;
  int distance;
  String name;
};

// מערך חיישני המרחק
DistanceSensor sensors[SENSOR_COUNT] = {
  {TRIG_PIN_TOP, ECHO_PIN_TOP, 0, "TOP"},
  {TRIG_PIN_BOTTOM, ECHO_PIN_BOTTOM, 0, "BOTTOM"},
  {TRIG_PIN_LEFT, ECHO_PIN_LEFT, 0, "LEFT"},
  {TRIG_PIN_RIGHT, ECHO_PIN_RIGHT, 0, "RIGHT"}
};

enum Direction {
  UP,    // חול נופל מלמעלה למטה
  DOWN,  // חול נופל מלמטה למעלה
  LEFT,  // חול נופל משמאל לימין
  RIGHT  // חול נופל מימין לשמאל
};

// משתנים לשעון החול
WebServer server(80);
unsigned long totalTimeMs = 60000;  // זמן ברירת מחדל: דקה אחת
unsigned long startTime = 0;
bool isRunning = false;
bool sandMatrix[HEIGHT][WIDTH];  // מטריצה לייצוג החול
int totalSandPixels = 0;
int fallenSandPixels = 0;
Direction currentDirection = UP;
Direction lastDirection = UP;

// משתנים לחיישני המרחק
unsigned long lastSensorRead = 0;
const int SENSOR_READ_INTERVAL = 200; // קרא חיישנים כל 200ms
const int MIN_DISTANCE_THRESHOLD = 15; // סף מינימום למרחק (ס"מ)

// פונקציה להמרת קואורדינטות למטריצה
int getPixelIndex(int x, int y) {
  // זיגזג מיפוי למטריצה
  if (y % 2 == 0) {
    return y * WIDTH + x;
  } else {
    return y * WIDTH + (WIDTH - 1 - x);
  }
}

// אתחול חיישני המרחק
void initDistanceSensors() {
  for (int i = 0; i < SENSOR_COUNT; i++) {
    pinMode(sensors[i].trigPin, OUTPUT);
    pinMode(sensors[i].echoPin, INPUT);
  }
  Serial.println("Distance sensors initialized");
}

// קריאת מרחק מחיישן בודד
int readDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); 
  if (duration == 0) {
    return 999; // מרחק גדול במקרה של שגיאה
  }
  
  int distance = duration * 0.034 / 2;
  return distance;
}

// קריאת כל חיישני המרחק
void readAllDistanceSensors() {
  if (millis() - lastSensorRead < SENSOR_READ_INTERVAL) return;

  for (int i = 0; i < SENSOR_COUNT; i++) {
    sensors[i].distance = readDistance(sensors[i].trigPin, sensors[i].echoPin);
  }

  lastSensorRead = millis();
}

// קביעת כיוון השעון על בסיס חיישני המרחק
Direction determineDirection() {
  readAllDistanceSensors();

  int minDistance = 999;
  int closestSensor = 0;

  // מצא את החיישן הקרוב ביותר לרצפה
  for (int i = 0; i < SENSOR_COUNT; i++) {
    if (sensors[i].distance < minDistance) {
      minDistance = sensors[i].distance;
      closestSensor = i;
    }
  }

  // אם המרחק קטן מהסף, החיישן קרוב לרצפה
  if (minDistance < MIN_DISTANCE_THRESHOLD) {
    switch (closestSensor) {
      case 0: return DOWN;  // TOP sensor קרוב = השעון הפוך, חול נופל מלמטה למעלה
      case 1: return UP;    // BOTTOM sensor קרוב = השעון זקוף, חול נופל מלמעלה למטה
      case 2: return RIGHT; // LEFT sensor קרוב = השעון על הצד שמאלי, חול נופל לימין
      case 3: return LEFT;  // RIGHT sensor קרוב = השעון על הצד ימני, חול נופל לשמאל
    }
  }

  return currentDirection; // השאר את הכיוון הנוכחי אם לא זוהה שינוי
}

// בדיקה אם השעון שינה כיוון
bool checkDirectionChange() {
  Direction newDirection = determineDirection();
  
  if (newDirection != currentDirection) {
    lastDirection = currentDirection;
    currentDirection = newDirection;
    
    Serial.print("Direction changed to: ");
    Serial.println(currentDirection == UP ? "UP" : 
                   currentDirection == DOWN ? "DOWN" : 
                   currentDirection == LEFT ? "LEFT" : "RIGHT");
    
    return true;
  }
  
  return false;
}

// אתחול מטריצת החול לפי הכיוון
void initSandMatrix() {
  totalSandPixels = 0;
  fallenSandPixels = 0;

  // נקה את כל המטריצה
  for (int y = 0; y < HEIGHT; y++) {
    for (int x = 0; x < WIDTH; x++) {
      sandMatrix[y][x] = false;
    }
  }

  // מלא חול לפי הכיוון
  switch (currentDirection) {
    case UP:
      // מלא את החצי העליון
      for (int y = 0; y < HEIGHT / 2; y++) {
        for (int x = 0; x < WIDTH; x++) {
          sandMatrix[y][x] = true;
          totalSandPixels++;
        }
      }
      break;
      
    case DOWN:
      // מלא את החצי התחתון
      for (int y = HEIGHT / 2; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
          sandMatrix[y][x] = true;
          totalSandPixels++;
        }
      }
      break;
      
    case LEFT:
      // מלא את החצי השמאלי
      for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH / 2; x++) {
          sandMatrix[y][x] = true;
          totalSandPixels++;
        }
      }
      break;
      
    case RIGHT:
      // מלא את החצי הימני
      for (int y = 0; y < HEIGHT; y++) {
        for (int x = WIDTH / 2; x < WIDTH; x++) {
          sandMatrix[y][x] = true;
          totalSandPixels++;
        }
      }
      break;
  }

  Serial.printf("Sand matrix initialized with %d pixels for direction %d\n", totalSandPixels, currentDirection);
}

// עדכון אנימציית החול
void updateSandAnimation() {
  if (!isRunning || totalSandPixels == 0) return;

  unsigned long elapsed = millis() - startTime;
  float progress = (float)elapsed / totalTimeMs;

  if (progress >= 1.0) {
    // סיום הספירה
    isRunning = false;
    Serial.println("Timer finished!");
    return;
  }

  // חישוב כמה חול צריך ליפול עד עכשיו
  int targetFallenPixels = (int)(progress * totalSandPixels);

  // הפל חול נוסף אם צריך
  while (fallenSandPixels < targetFallenPixels) {
    dropRandomSandPixel();
    fallenSandPixels++;
  }
}

// הפלת פיקסל חול רנדומלי לפי הכיוון
void dropRandomSandPixel() {
  for (int attempts = 0; attempts < 100; attempts++) {
    int x, y;
    
    // בחר פיקסל רנדומלי מהאזור המתאים לפי הכיוון
    switch (currentDirection) {
      case UP:
        x = random(WIDTH);
        y = random(0, HEIGHT / 2);  // רק בחצי העליון
        break;
      case DOWN:
        x = random(WIDTH);
        y = random(HEIGHT / 2, HEIGHT);  // רק בחצי התחתון
        break;
      case LEFT:
        x = random(0, WIDTH / 2);  // רק בחצי השמאלי
        y = random(HEIGHT);
        break;
      case RIGHT:
        x = random(WIDTH / 2, WIDTH);  // רק בחצי הימני
        y = random(HEIGHT);
        break;
    }

    if (sandMatrix[y][x]) {
      // הסר את החול מהמיקום הנוכחי
      sandMatrix[y][x] = false;

      // מצא את המיקום אליו החול יפול
      int targetX = x, targetY = y;
      
      switch (currentDirection) {
        case UP:
          // חול נופל למטה
          targetY = HEIGHT - 1;
          for (int checkY = HEIGHT / 2; checkY < HEIGHT; checkY++) {
            if (!sandMatrix[checkY][x]) {
              targetY = checkY;
              break;
            }
          }
          break;
          
        case DOWN:
          // חול נופל למעלה
          targetY = 0;
          for (int checkY = HEIGHT / 2 - 1; checkY >= 0; checkY--) {
            if (!sandMatrix[checkY][x]) {
              targetY = checkY;
              break;
            }
          }
          break;
          
        case LEFT:
          // חול נופל לימין
          targetX = WIDTH - 1;
          for (int checkX = WIDTH / 2; checkX < WIDTH; checkX++) {
            if (!sandMatrix[y][checkX]) {
              targetX = checkX;
              break;
            }
          }
          break;
          
        case RIGHT:
          // חול נופל לשמאל
          targetX = 0;
          for (int checkX = WIDTH / 2 - 1; checkX >= 0; checkX--) {
            if (!sandMatrix[y][checkX]) {
              targetX = checkX;
              break;
            }
          }
          break;
      }

      // הוסף את החול למיקום החדש
      sandMatrix[targetY][targetX] = true;
      return;
    }
  }
}

// עדכון התצוגה
void updateDisplay() {
  // נקה את כל הלדים
  fill_solid(leds, NUM_LEDS, CRGB::Black);

  // הצג את החול
  for (int y = 0; y < HEIGHT; y++) {
    for (int x = 0; x < WIDTH; x++) {
      if (sandMatrix[y][x]) {
        int pixelIndex = getPixelIndex(x, y);
        
        // צבע החול לפי האזור והכיוון
        switch (currentDirection) {
          case UP:
            leds[pixelIndex] = (y < HEIGHT / 2) ? CRGB::Yellow : CRGB::Orange;
            break;
          case DOWN:
            leds[pixelIndex] = (y >= HEIGHT / 2) ? CRGB::Yellow : CRGB::Orange;
            break;
          case LEFT:
            leds[pixelIndex] = (x < WIDTH / 2) ? CRGB::Yellow : CRGB::Orange;
            break;
          case RIGHT:
            leds[pixelIndex] = (x >= WIDTH / 2) ? CRGB::Yellow : CRGB::Orange;
            break;
        }
      }
    }
  }

  // הוסף קו אמצע (הפרדה בין החלקים)
  switch (currentDirection) {
    case UP:
    case DOWN:
      for (int x = 0; x < WIDTH; x++) {
        int pixelIndex = getPixelIndex(x, HEIGHT / 2 - 1);
        if (leds[pixelIndex] == CRGB::Black) {
          leds[pixelIndex] = CRGB(20, 20, 20);
        }
      }
      break;
    case LEFT:
    case RIGHT:
      for (int y = 0; y < HEIGHT; y++) {
        int pixelIndex = getPixelIndex(WIDTH / 2 - 1, y);
        if (leds[pixelIndex] == CRGB::Black) {
          leds[pixelIndex] = CRGB(20, 20, 20);
        }
      }
      break;
  }

  FastLED.show();
}

// פונקציות השרת
void handleSetTime() {
  if (server.hasArg("minutes")) {
    float minutes = server.arg("minutes").toFloat();
    totalTimeMs = (unsigned long)(minutes * 60 * 1000);

    Serial.printf("Timer set to %.2f minutes (%lu ms)\n", minutes, totalTimeMs);

    server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Timer set successfully\"}");
  } else {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing minutes parameter\"}");
  }
}

void handleStart() {
  initSandMatrix();
  startTime = millis();
  isRunning = true;

  Serial.println("Timer started!");
  server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Timer started\"}");
}

void handleStop() {
  isRunning = false;

  Serial.println("Timer stopped!");
  server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Timer stopped\"}");
}

void handleStatus() {
  String status = isRunning ? "running" : "stopped";
  unsigned long elapsed = isRunning ? (millis() - startTime) : 0;
  float progress = isRunning ? ((float)elapsed / totalTimeMs) * 100 : 0;
  
  // הגבל את ההתקדמות ל-100%
  if (progress > 100) progress = 100;

  String directionStr = (currentDirection == UP) ? "UP" : 
                       (currentDirection == DOWN) ? "DOWN" : 
                       (currentDirection == LEFT) ? "LEFT" : "RIGHT";

  String json = "{";
  json += "\"status\":\"" + status + "\",";
  json += "\"progress\":" + String(progress) + ",";
  json += "\"totalTime\":" + String(totalTimeMs / 1000) + ",";
  json += "\"elapsed\":" + String(elapsed / 1000) + ",";
  json += "\"direction\":\"" + directionStr + "\",";
  json += "\"distances\":[";
  for (int i = 0; i < SENSOR_COUNT; i++) {
    json += String(sensors[i].distance);
    if (i < SENSOR_COUNT - 1) json += ",";
  }
  json += "]}";

  server.send(200, "application/json", json);
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>Digital Hourglass</title></head><body>";
  html += "<h1>Digital Hourglass Control</h1>";
  html += "<p>Set timer: <input type='number' id='minutes' value='1' step='0.1'> minutes</p>";
  html += "<button onclick='setTime()'>Set Time</button>";
  html += "<button onclick='startTimer()'>Start</button>";
  html += "<button onclick='stopTimer()'>Stop</button>";
  html += "<div id='status'></div>";
  html += "<div id='sensors'></div>";
  html += "<script>";
  html += "function setTime() { fetch('/setTime?minutes=' + document.getElementById('minutes').value); }";
  html += "function startTimer() { fetch('/start'); }";
  html += "function stopTimer() { fetch('/stop'); }";
  html += "setInterval(() => { ";
  html += "fetch('/status').then(r => r.json()).then(d => {";
  html += "document.getElementById('status').innerHTML = 'Status: ' + d.status + ', Progress: ' + d.progress.toFixed(1) + '%, Direction: ' + d.direction;";
  html += "document.getElementById('sensors').innerHTML = 'Distances: TOP=' + d.distances[0] + 'cm, BOTTOM=' + d.distances[1] + 'cm, LEFT=' + d.distances[2] + 'cm, RIGHT=' + d.distances[3] + 'cm';";
  html += "}); }, 1000);";
  html += "</script></body></html>";

  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(9600);

  // אתחול FastLED
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
  FastLED.clear();
  FastLED.show();

  // אתחול חיישני המרחק
  initDistanceSensors();

  // התחברות לWiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  // הגדרת השרת
  server.on("/", handleRoot);
  server.on("/setTime", handleSetTime);
  server.on("/start", handleStart);
  server.on("/stop", handleStop);
  server.on("/status", handleStatus);

  server.enableCORS(true);
  server.begin();
  Serial.println("HTTP server started");

  // אתחול ראשוני של המטריצה
  initSandMatrix();

  Serial.println("Digital Hourglass ready!");
}
void loop() {
  server.handleClient();

  // בדיקה אם השעון שינה כיוון - רק אם הטיימר לא רץ כרגע
  if (!isRunning && checkDirectionChange()) {
    // אם השעון שינה כיוון ואין טיימר פעיל, התחל טיימר חדש
    initSandMatrix();
    startTime = millis();
    isRunning = true;
  }

  // עדכון אנימציית החול
  updateSandAnimation();

  // עדכון התצוגה
  updateDisplay();

  delay(50);  // מקצב רענון
}
