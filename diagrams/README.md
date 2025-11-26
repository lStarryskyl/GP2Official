# The Architect AI - Visual Diagrams

This directory contains PlantUML diagram source files for The Architect AI system.

## How to View Diagrams

### Option 1: Online PlantUML Editor
1. Go to https://www.plantuml.com/plantuml/uml/
2. Copy the content from any `.puml` file
3. Paste it into the editor
4. View the rendered diagram

### Option 2: VS Code Extension
1. Install "PlantUML" extension in VS Code
2. Open any `.puml` file
3. Press `Alt + D` to preview

### Option 3: Local PlantUML Installation
```bash
# Install PlantUML
sudo apt-get install plantuml

# Generate SVG from .puml file
plantuml -tsvg use_case_diagram.puml

# Generate PNG
plantuml -tpng class_diagram.puml
```

### Option 4: Docker
```bash
# Run PlantUML server
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty

# Access at http://localhost:8080
```

## Diagram Files

### 1. Use Case Diagram (`use_case_diagram.puml`)
- **Purpose:** Shows all system actors and their interactions
- **Actors:** Product Owner, Software Engineer, Project Manager, System Admin, AI Agent System
- **Key Use Cases:** Project creation, SRS generation, task planning, risk analysis
- **Relationships:** Include, extend, and generalization relationships

### 2. Class Diagram (`class_diagram.puml`)
- **Purpose:** Defines the object-oriented structure of the system
- **Key Classes:** User, Project, Requirement, Artifact, Task, Agent, Risk, TestCase
- **Relationships:** Inheritance, composition, aggregation, association
- **Design Patterns:** Service layer, agent pattern, factory pattern

### 3. ER Diagram (`er_diagram.puml`)
- **Purpose:** Database schema with entities and relationships
- **Collections:** organizations, users, projects, requirements, artifacts, diagrams, tasks, agent_jobs, risks, test_cases, comments, activity_logs, integrations
- **Indexes:** Optimized for query performance
- **Relationships:** One-to-many, many-to-many with foreign keys

### 4. Sequence Diagrams

#### a. Project Creation Sequence (`sequence_project_creation.puml`)
- **Flow:** User creates project → AI processing initiated → Multiple agents execute → Results stored
- **Agents:** ParsingAgent, AnalystAgent, DesignerAgent, PlannerAgent, QualityAgent
- **Duration:** End-to-end project processing workflow

#### b. SRS Edit Sequence (`sequence_srs_edit.puml`)
- **Flow:** View SRS → Edit content → Add comments → Approval workflow → Export
- **Actors:** Product Owner, Software Engineer
- **Features:** Real-time collaboration, version control, notifications

#### c. Task Planning Sequence (`sequence_task_planning.puml`)
- **Flow:** View tasks → Adjust estimates → Gantt chart → Assign tasks → Track progress → Complete
- **Actors:** Project Manager, Software Engineer
- **Features:** Task assignment, dependency management, progress tracking

## Diagram Conventions

### Colors
- **Actors:** Different colors per role type
- **System Boundary:** Light blue background
- **Use Cases:** Grouped by functional area
- **Classes:** Light blue background, abstract classes in light red
- **Critical Path:** Red highlighting in Gantt charts

### Notation
- `<<include>>`: Mandatory sub-functionality
- `<<extend>>`: Optional extension points
- `<<FK>>`: Foreign key in database
- `<<PK>>`: Primary key in database
- `<<UNIQUE>>`: Unique constraint

## Updating Diagrams

When modifying the system design:
1. Update the corresponding `.puml` file
2. Regenerate the diagram to verify syntax
3. Update this README if adding new diagrams
4. Commit both `.puml` and generated images (if stored)

## Export Formats

PlantUML supports multiple output formats:
- **SVG:** Vector graphics, scalable, recommended for web
- **PNG:** Raster graphics, good for documentation
- **PDF:** For printing and formal documents
- **LaTeX:** For academic papers
- **ASCII Art:** Text-based representation

## Diagram Generation Commands

```bash
# Generate all diagrams as SVG
for file in *.puml; do plantuml -tsvg "$file"; done

# Generate all diagrams as PNG (high resolution)
for file in *.puml; do plantuml -tpng "$file" -DPLANTUML_LIMIT_SIZE=8192; done

# Generate all diagrams as PDF
for file in *.puml; do plantuml -tpdf "$file"; done
```

## Integration with Documentation

These diagrams are referenced in:
- `/app/DESIGN_DOCUMENT.md` - System design overview
- `/app/REQUIREMENTS_SPECIFICATION.md` - Requirements details
- Future API documentation
- Developer onboarding guides

## Notes

- Diagrams are kept in sync with implementation
- Version controlled alongside code
- Used for instructor reviews and technical presentations
- Suitable for inclusion in project reports and documentation
