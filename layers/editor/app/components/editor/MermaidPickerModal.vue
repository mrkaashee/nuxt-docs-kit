<script lang="ts" setup>
/**
 * MermaidPickerModal
 *
 * Shown when the author inserts a Mermaid diagram from the slash menu.
 * Lets them choose "Blank" or one of the sample diagram types.
 * Emits `insert` with the chosen mermaid source string.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
  }>(),
  { open: false },
)

const emit = defineEmits<{
  "update:open": [value: boolean]
  insert: [code: string]
}>()

// ── Sample diagrams ───────────────────────────────────────────────────────────

const SAMPLES = [
  {
    id: "blank",
    label: "Blank",
    icon: "i-lucide-file",
    description: "Start from scratch",
    code: `flowchart TD
    A[Start] --> B[End]`,
  },
  {
    id: "flowchart",
    label: "Flowchart",
    icon: "i-lucide-git-branch",
    description: "Process flow with decisions",
    code: `flowchart TD
    A([Start]) --> B[Step 1]
    B --> C{Decision}
    C -->|Yes| D[Step 2]
    C -->|No| E[Step 3]
    D --> F([End])
    E --> F`,
  },
  {
    id: "sequence",
    label: "Sequence",
    icon: "i-lucide-arrow-right-left",
    description: "Interactions between actors",
    code: `sequenceDiagram
    autonumber
    Actor A as Alice
    Actor B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great, thanks!
    A->>B: Let's work on this together
    B-->>A: Sounds good!`,
  },
  {
    id: "class",
    label: "Class Diagram",
    icon: "i-lucide-boxes",
    description: "OOP class relationships",
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    class Cat {
        +boolean indoor
        +purr() void
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: "er",
    label: "ER Diagram",
    icon: "i-lucide-database",
    description: "Entity-relationship model",
    code: `erDiagram
    USER {
        int id PK
        string name
        string email
    }
    POST {
        int id PK
        string title
        string body
        int userId FK
    }
    COMMENT {
        int id PK
        string text
        int postId FK
        int userId FK
    }
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : writes
    POST ||--o{ COMMENT : has`,
  },
  {
    id: "gantt",
    label: "Gantt Chart",
    icon: "i-lucide-calendar-range",
    description: "Project timeline",
    code: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
        Requirements   :done, req, 2024-01-01, 7d
        Design         :done, des, after req, 5d
    section Development
        Backend        :active, be, after des, 14d
        Frontend       :fe, after des, 14d
    section Launch
        Testing        :test, after be, 7d
        Deployment     :deploy, after test, 2d`,
  },
  {
    id: "pie",
    label: "Pie Chart",
    icon: "i-lucide-pie-chart",
    description: "Proportional data",
    code: `pie title Browser Market Share
    "Chrome" : 65.5
    "Safari" : 18.9
    "Firefox" : 4.0
    "Edge" : 4.4
    "Other" : 7.2`,
  },
  {
    id: "mindmap",
    label: "Mind Map",
    icon: "i-lucide-brain",
    description: "Hierarchical idea map",
    code: `mindmap
  root((Main Idea))
    Topic A
      Subtopic A1
      Subtopic A2
    Topic B
      Subtopic B1
      Subtopic B2
    Topic C
      Subtopic C1`,
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: "i-lucide-milestone",
    description: "Chronological events",
    code: `timeline
    title History of the Web
    section 1990s
        1991 : World Wide Web launched
        1994 : Netscape Navigator released
        1995 : JavaScript created
    section 2000s
        2004 : Firefox released
        2007 : iPhone launched
        2008 : Chrome released
    section 2010s
        2015 : ES6 / modern JS
        2017 : Progressive Web Apps`,
  },
  {
    id: "state",
    label: "State Diagram",
    icon: "i-lucide-circle-dot",
    description: "State machine / transitions",
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : start()
    Loading --> Success : data received
    Loading --> Error : request failed
    Success --> Idle : reset()
    Error --> Idle : retry()
    Error --> [*] : cancel()`,
  },
]

const selected = ref<string | null>(null)

// Reset selection when modal opens
watch(
  () => props.open,
  (val) => {
    if (val) selected.value = null
  },
)

function choose(id: string) {
  selected.value = id
}

function insert() {
  const sample = SAMPLES.find((s) => s.id === selected.value)
  if (!sample) return
  emit("insert", sample.code)
  emit("update:open", false)
}

function cancel() {
  emit("update:open", false)
}
</script>

<template>
  <UModal
    :open="open"
    title="Insert Mermaid Diagram"
    description="Choose a diagram type to get started, or start blank."
    :ui="{ width: 'max-w-2xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <button
          v-for="sample in SAMPLES"
          :key="sample.id"
          type="button"
          class="focus-visible:ring-primary flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors focus:outline-none focus-visible:ring-2"
          :class="
            selected === sample.id
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-default hover:border-accented hover:bg-elevated text-default'
          "
          @click="choose(sample.id)"
        >
          <UIcon :name="sample.icon" class="h-6 w-6 shrink-0" />
          <span class="text-xs leading-tight font-semibold">{{ sample.label }}</span>
          <span class="text-muted text-[10px] leading-tight">{{ sample.description }}</span>
        </button>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="cancel" />
        <UButton
          label="Insert"
          icon="i-lucide-plus"
          color="primary"
          :disabled="!selected"
          @click="insert"
        />
      </div>
    </template>
  </UModal>
</template>
