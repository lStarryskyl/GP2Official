/**
 * PlantUML Encoder
 * 
 * Implements the official PlantUML encoding algorithm:
 * 1. UTF-8 encode the text
 * 2. Compress with deflate
 * 3. Encode with PlantUML's custom base64 alphabet
 * 
 * @see https://plantuml.com/text-encoding
 */

import pako from 'pako';

// PlantUML's custom base64 alphabet (different from standard base64)
const PLANTUML_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

/**
 * Encode 3 bytes into 4 PlantUML base64 characters
 */
function encode3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  
  return (
    PLANTUML_ALPHABET.charAt(c1 & 0x3F) +
    PLANTUML_ALPHABET.charAt(c2 & 0x3F) +
    PLANTUML_ALPHABET.charAt(c3 & 0x3F) +
    PLANTUML_ALPHABET.charAt(c4 & 0x3F)
  );
}

/**
 * Encode a Uint8Array using PlantUML's base64 variant
 */
function encodePlantUMLBase64(data: Uint8Array): string {
  let result = '';
  const len = data.length;
  
  for (let i = 0; i < len; i += 3) {
    if (i + 2 < len) {
      result += encode3bytes(data[i], data[i + 1], data[i + 2]);
    } else if (i + 1 < len) {
      result += encode3bytes(data[i], data[i + 1], 0);
    } else {
      result += encode3bytes(data[i], 0, 0);
    }
  }
  
  return result;
}

/**
 * Encode PlantUML text to a URL-safe string for the PlantUML server
 * 
 * @param text - Raw PlantUML code (e.g., "@startuml ... @enduml")
 * @returns Encoded string suitable for PlantUML server URLs
 */
export function encodePlantUML(text: string): string {
  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Compress with deflate (raw deflate, not gzip)
  const compressed = pako.deflateRaw(data, { level: 9 });
  
  // Encode with PlantUML's base64 variant
  return encodePlantUMLBase64(compressed);
}

/**
 * Generate a PlantUML server URL for the given diagram code
 * 
 * @param text - Raw PlantUML code
 * @param format - Output format: 'svg', 'png', or 'txt'
 * @param server - PlantUML server URL (defaults to official server)
 * @returns Full URL to the rendered diagram
 */
export function getPlantUMLUrl(
  text: string,
  format: 'svg' | 'png' | 'txt' = 'svg',
  server: string = 'https://www.plantuml.com/plantuml'
): string {
  const encoded = encodePlantUML(text);
  return `${server}/${format}/${encoded}`;
}

/**
 * Check if a PlantUML server response indicates an error
 */
export function isPlantUMLError(url: string): boolean {
  // PlantUML error responses contain specific patterns
  return url.includes('ErrorBadUrl') || url.includes('SyntaxError');
}

/**
 * Default PlantUML templates for different diagram types
 */
export const DIAGRAM_TEMPLATES = {
  use_case: `@startuml
!theme cerulean
title High-Level Use Cases

actor User
actor Admin

rectangle "Project Planning Platform" {
  usecase "Create Project" as UC_Create
  usecase "Plan Phases" as UC_Plan
  usecase "Generate Diagrams" as UC_Diagrams
  usecase "Track Tasks" as UC_Tasks
}

User --> UC_Create
User --> UC_Plan
User --> UC_Diagrams
User --> UC_Tasks

Admin --> UC_Plan
Admin --> UC_Diagrams

@enduml`,

  erd: `@startuml
!theme cerulean
title Entity Relationship Diagram

entity "User" {
  *user_id : UUID <<PK>>
  --
  *email : VARCHAR(255)
  first_name : VARCHAR(100)
  last_name : VARCHAR(100)
}

entity "Project" {
  *project_id : UUID <<PK>>
  --
  *owner_id : UUID <<FK>>
  *name : VARCHAR(255)
  status : VARCHAR(50)
}

entity "Task" {
  *task_id : UUID <<PK>>
  --
  *project_id : UUID <<FK>>
  *title : VARCHAR(255)
  status : VARCHAR(50)
}

User ||--o{ Project : owns
Project ||--o{ Task : contains

@enduml`,

  class: `@startuml
!theme cerulean
title Class Diagram

class User {
  -email: String
  +firstName: String
  +authenticate(): Boolean
}

class Project {
  +name: String
  +status: Status
  +addTask(task): void
}

class Task {
  +title: String
  +status: Status
  +complete(): void
}

User "1" --> "*" Project : owns
Project "1" --> "*" Task : contains

@enduml`,

  sequence: `@startuml
!theme cerulean
title Authentication Flow

actor User
participant "Frontend" as FE
participant "API" as API
database "Database" as DB

User -> FE: Enter credentials
FE -> API: POST /auth/login
API -> DB: Validate user
DB --> API: User record
API --> FE: JWT Token
FE --> User: Redirect to dashboard

@enduml`,

  state: `@startuml
!theme cerulean
title Task State Machine

[*] --> Todo : create
Todo --> InProgress : start
InProgress --> Review : complete
Review --> Done : approve
Review --> InProgress : request changes
Done --> [*]

@enduml`,

  activity: `@startuml
!theme cerulean
title Project Workflow

start
:User creates project;
if (Valid input?) then (yes)
  :Save project;
  :Initialize phases;
  :Notify user;
else (no)
  :Show errors;
  stop
endif
:Project ready;
stop

@enduml`,
};

export type DiagramType = keyof typeof DIAGRAM_TEMPLATES;
