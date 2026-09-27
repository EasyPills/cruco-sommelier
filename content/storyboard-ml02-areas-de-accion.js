/* =========================================================================
   Lección 2 · ML02 — Áreas de acción y campos de ejercicio
   -------------------------------------------------------------------------
   Source (approved, injected 2026-09-15):
     00-Storyboards-Aprobados/storyboard-ml02-areas-de-accion_Edited_VSCpode.pptx
     Google Drive id 1P35YKWUy8bWRVAjQXZ3rRP5yD7RsN3Im · sha1 03c8178d5381386a…
     Header: "Module: Intro — El Sommelier Moderno · Micro-learning 2/19 ·
     Target duration 6 min · Objective O1 · Outcome LO1". Screens 1-9.

   Storyboard notation removed from learner text (kept in `storyboard.notes`):
     -Instruction- / -Feedback- / -Buckets:- / -Items to classify:-
     "→"        marks which bucket an item belongs to
     "(✓)"      marks the correct option
   Storyboard v2 re-injected 2026-09-17 (sha1 0b02fbe366f77efb…): VO links,
   carousel images, new OST on screens 3/7/8, "Palabra Wiki" comments.
   Assets in place: VO for screens 1, 4 (two files), 5 and 8; the four gold
   illustrations of the carousel.
   Still to arrive (empty slots, visible in the editor):
     · Screen 3 video ("Video here:" is empty in the storyboard).
     · VO for screens 2, 3, 6, 7 and 9 (none linked; 7 has no VO in v2).
     · Bespoke gold icons for screen 5 ("Icons example here:" is empty).
   Design decisions carried over from ML01 (client 2026-09-15):
     · Key message (key icon) -> gold box that bleeds off the edge (`band`).
     · Learning objective -> navy box, full width (`variant: "objective"`,
       `wide: true`), founder portrait in a circle above the title.
   ========================================================================= */
CruCo.registerStoryboard(/*<storyboard>*/ {
  "id": "ml02",
  "title": "Áreas de acción y campos de ejercicio",
  "lesson": 2,
  "point": {
    "number": 1,
    "title": "Rol del sommelier y áreas de acción"
  },
  "duration": "~ 5 min",
  "module": {
    "id": "intro",
    "number": 1,
    "title": "Módulo introductorio"
  },
  "source": "storyboard-ml02-areas-de-accion_Edited_VSCpode.pptx v2 (2026-09-17, Screens 1-9)",
  "glossary": [
    {
      "term": "Négociant",
      "definition": "Término francés (se pronuncia *negosián*). Comerciante de vinos que compra uva, mosto o vino ya hecho a distintos productores, lo cría o lo ensambla y lo vende bajo su propia marca. Es una salida profesional habitual en la rama comercial.",
      "screen": "3.4"
    },
    {
      "term": "Storytelling",
      "definition": "Contar la historia que hay detrás de una botella —el origen, la bodega, la añada, la gente— para que el comensal conecte con ella. Bien hecho, convierte una etiqueta desconocida en una elección deseada.",
      "screen": "3.5"
    },
    {
      "term": "Upselling",
      "definition": "Sugerir una opción de mayor valor que la que el comensal pensaba pedir, cuando de verdad encaja mejor con su plato o su gusto. No es «vender más caro», es **asesorar hacia arriba** con criterio.",
      "screen": "3.5"
    }
  ],
  "screens": [
    {
      "id": "3.1",
      "layout": "centered",
      "eyebrow": "Lección 2 · Módulo 1",
      "title": "Áreas de acción",
      "avatar": {
        "src": "assets/images/ml01/ml01-p8-melina-aguirre.jpg",
        "alt": "Melina Aguirre Jaén, quien presenta esta lección."
      },
      "audio": {
        "src": "assets/audio/ml02/ml02-p1-vo.mp3",
        "transcript": "Exploremos las áreas de acción; dónde ejerce su profesión y qué hace exactamente un sommelier. Al finalizar, visualizarás no sólo donde se desarrolla el rol, sino también la extensión de sus capacidades."
      },
      "blocks": [
        {
          "type": "callout",
          "variant": "objective",
          "wide": true,
          "text": "Al finalizar, visualizarás **donde se desarrolla el rol**, y la **extensión de sus capacidades**.",
          "reveal": {
            "at": 7.58,
            "effect": "write"
          }
        }
      ],
      "storyboard": {
        "screen": "Screen 1",
        "objective": "[LO1] Open the topic and set the module's aspirational tone.",
        "brief": "Cover consistent with ML1 (same module). CruCo brand palette, audio and logo. Learning objective displayed. TEXT BASED.",
        "visualRefs": "Premium course title cards; minimal editorial typography.",
        "aiPrompt": "Cover consistent with ML1. Refined editorial title card.",
        "vo": "Exploremos las áreas de acción; dónde ejerce su profesión y qué hace exactamente un sommelier. Al finalizar, visualizarás no sólo donde se desarrolla el rol, sino también la extensión de sus capacidades.",
        "notes": [
          "OST also carried 'Lección 2 – Módulo 1 · 5-6 min': the lesson label is the eyebrow; the duration is not shown to the learner (the player already gives progress).",
          "Same layout as ML01 screen 1 so the two lessons open alike; VO file pending.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): VO file linked (VO_M1-L2_Screen1.mp3, 15.4 s).",
          "Objective box appears when the VO says 'Al finalizar' (7.58 s, measured on the file), as on ML01's cover.",
          "Brief: 'Cover consistent with ML1 (same module)': same background photo, founder circle and navy objective box as ML01 screen 1."
        ]
      },
      "background": {
        "src": "assets/images/ml01/ml01-p1-fondo-copa.jpg",
        "alt": "",
        "layout": "light"
      }
    },
    {
      "id": "3.2",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "VO pendiente de producción para esta pantalla."
      },
      "blocks": [
        {
          "type": "quiz",
          "id": "ml02-enganche",
          "questions": [
            {
              "id": "hook",
              "type": "single",
              "prompt": "¿Dónde crees que puede trabajar un sommelier profesional?",
              "hint": "Escoge la mejor respuesta:",
              "revealCorrect": true,
              "options": [
                {
                  "text": "A. Solo en restaurantes de alta gama."
                },
                {
                  "text": "B. En restaurantes, hoteles, cruceros, vinotecas e incluso como comprador o representante de marca.",
                  "correct": true
                },
                {
                  "text": "C. Principalmente en restaurantes."
                }
              ],
              "feedback": {
                "correct": "La carrera del sommelier no termina en la sala: es un camino con muchísimas posibilidades para escalar.",
                "incorrect": "La carrera del sommelier no termina en la sala: es un camino con muchísimas posibilidades para escalar."
              }
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 2",
        "objective": "[LO1] Activate the learner's prior beliefs about the topic (ungraded hook).",
        "brief": "Light 'tap & reveal' as in Rise. No penalty; activation goal. Icon: question icon. When correct: cheering noise.",
        "visualRefs": "Clean quiz UI; editorial choose the correct answer; subtle reveal animation.",
        "aiPrompt": "Minimal multiple-choice card UI with 3 options and a soft highlight-reveal on the correct option, editorial and uncluttered. No penalty; activation goal. Use the CruCo brand palette.",
        "vo": "(sin VO en el storyboard)",
        "notes": [
          "-Instruction options- -> question hint; -Feedback- is storyboard notation, not learner text.",
          "Same feedback for correct and incorrect: the storyboard gives one reveal line for this ungraded hook (as in ML01).",
          "When correct: cheering noise -> SFX in courseConfig."
        ]
      }
    },
    {
      "id": "3.3",
      "layout": "standard",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "Ya sabes que el sommelier es un estratega. Pero, ¿dónde ejerce y qué hace exactamente en su día a día? Su campo de acción es mucho más amplio de lo que parece: va del restaurante de alta gama a los cruceros de lujo, las vinotecas e incluso roles comerciales como comprador o representante de marca. Su desarrollo profesional puede extenderse a distintos campos y, dentro del restaurante, abarcar áreas muy diversas."
      },
      "blocks": [
        {
          "type": "video",
          "title": "Dónde ejerce el sommelier",
          "src": "",
          "poster": "",
          "captions": "",
          "script": "Ya sabes que el sommelier es un estratega. Pero, ¿dónde ejerce y qué hace exactamente en su día a día? Su campo de acción es mucho más amplio de lo que parece: va del restaurante de alta gama a los cruceros de lujo, las vinotecas e incluso roles comerciales como comprador o representante de marca. Su desarrollo profesional puede extenderse a distintos campos y, dentro del restaurante, abarcar áreas muy diversas.",
          "transcript": "Ya sabes que el sommelier es un estratega. Pero, ¿dónde ejerce y qué hace exactamente en su día a día? Su campo de acción es mucho más amplio de lo que parece: va del restaurante de alta gama a los cruceros de lujo, las vinotecas e incluso roles comerciales como comprador o representante de marca. Su desarrollo profesional puede extenderse a distintos campos y, dentro del restaurante, abarcar áreas muy diversas.",
          "endText": "Su campo de acción es mucho más amplio de lo que parece: va del restaurante de alta gama a los cruceros de lujo, las vinotecas e incluso roles comerciales como comprador o representante de marca. Su desarrollo profesional puede extenderse a distintos campos y, dentro del restaurante, abarcar áreas muy diversas."
        }
      ],
      "storyboard": {
        "screen": "Screen 3",
        "objective": "[LO1] Frame the micro-learning and preview what the learner will be able to do.",
        "brief": "Video image is frozen when finished. On top, this text on a blue CruCo text box appears on top of the frozen video. (v1: automatic video of sommelier walking towards a close up while the background changes from cruise ship to restaurant to office.)",
        "visualRefs": "Full screen video.",
        "aiPrompt": "CruCo brand palette, clean modern editorial composition, refined and aspirational tone.",
        "vo": "(the script above is the video's own narration)",
        "notes": [
          "Video pending production: the slot shows the 'Video en producción' placeholder and carries the script, ready to receive the file from the editor.",
          "The storyboard's screen audio and the video narration are the same script, so the screen keeps the text as the video transcript rather than duplicating a VO bar.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): OST paragraph shown in a navy CruCo box over the last frame when the video ends (`endText`); while the file is pending it sits on the placeholder.",
          "Video still pending ('Video here:' empty). Drive also holds VO_M1-L2_Screen3.mp3, not linked in the storyboard: owner confirmed 2026-09-17 it does not go on the screen (likely the video's own narration)."
        ]
      }
    },
    {
      "id": "3.4",
      "layout": "standard",
      "title": "",
      "audio": {
        "src": "assets/audio/ml02/ml02-p4-vo-1.mp3",
        "transcript": "A continuación, detallamos sus campos de acción:\n\nSi tienes el conocimiento, como sommelier puedes llegar muy lejos."
      },
      "blocks": [
        {
          "type": "carousel",
          "banner": "Campos de acción:",
          "items": [
            {
              "title": "Sala y hospitalidad",
              "text": "Restaurantes de alta gama, hoteles boutique, cruceros de lujo y resorts de 5 o más estrellas (donde suele empezar el Junior Sommelier).",
              "image": {
                "src": "assets/images/ml02/ml02-p4-1-sala-y-hospitalidad.png",
                "alt": "",
                "decorative": true
              }
            },
            {
              "title": "Retail e importación",
              "text": "Tiendas y vinotecas (venta directa), además de la compra e importación de vinos de todo el mundo.",
              "image": {
                "src": "assets/images/ml02/ml02-p4-2-retail-e-importacion.png",
                "alt": "",
                "decorative": true
              }
            },
            {
              "title": "Rama comercial",
              "text": "Broker, comprador, [[Négociant|négociant]], distribuidor, representante de marca y manager de portafolio vitivinícola.",
              "image": {
                "src": "assets/images/ml02/ml02-p4-3-rama-comercial.png",
                "alt": "",
                "decorative": true
              }
            },
            {
              "title": "Emprendimiento",
              "text": "Fundar restaurantes, wine bars, vinotecas, escuelas de vino, consultorías y curaduría de portafolios.",
              "image": {
                "src": "assets/images/ml02/ml02-p4-4-emprendimiento.png",
                "alt": "",
                "decorative": true
              }
            }
          ],
          "completeAudio": {
            "src": "assets/audio/ml02/ml02-p4-vo-2.mp3"
          },
          "hint": "Desliza hacia la derecha para descubrir el contenido."
        }
      ],
      "storyboard": {
        "screen": "Screen 4",
        "objective": "[LO1] Explain and help the learner describe: Development 1 — Where the sommelier works.",
        "brief": "Audio 1 is heard while the text is being displayed. Almost full screen image carrousel that needs to be swiped to view. On the top, there's a banner with the phrase 'Campos de acción:' that does not move along with the carrousel. Audio 2 is heard after the text has completely been displayed.",
        "visualRefs": "CruCo visual palette. Premium editorial design.",
        "aiPrompt": "Tabbed or 2x2 layout (one tile per field). Reinforce the 'career ladder' idea: it scales beyond the floor. Modern iconography, no decorative-wine clichés.",
        "vo": "-Audio 1- A continuación, detallamos sus campos de acción: … -Audio 2- Si tienes el conocimiento, como sommelier puedes llegar muy lejos.",
        "notes": [
          "The brief asks for a swipeable carousel with a fixed banner, so the `carousel` component is used rather than the 2x2 of the AI prompt.",
          "Bold field names kept verbatim from the storyboard OST.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): Audio 1 (VO_M1-L2_Screen4.mp3) plays with the screen; Audio 2 (VO_M1-L2_Screen4-2.mp3) plays once every field has been seen and Audio 1 is over (`completeAudio`).",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): the four gold illustrations from Drive folder 'M1_L2_Screen4_Campos de accion'. Decorative (the field name is the slide title), so alt is empty.",
          "'Si tienes el conocimiento, como sommelier puedes llegar muy lejos.' is Audio 2 (VO column, not OST): now heard and kept in the transcript, no longer shown on screen as it was before the file existed.",
          "Brief v2 dropped the 'Tabbed or 2x2 layout' alternative: the carousel is confirmed.",
          "Client 2026-09-18: instruction under the banner: 'Desliza hacia la derecha para descubrir el contenido.'"
        ]
      }
    },
    {
      "id": "3.5",
      "layout": "split",
      "title": "Funciones en el ámbito del restaurante",
      "audio": {
        "src": "assets/audio/ml02/ml02-p5-vo.mp3",
        "transcript": "Pasemos a explorar las cuatro funciones de vital importancia para el sommelier en el ámbito del restaurante: Curaduría. Gestión. Educar y educarse. Y quizás la más importante, la Venta."
      },
      "blocks": [
        {
          "type": "image",
          "region": "aside",
          "src": "assets/images/ml02/ml02-p5b-restaurante.jpg",
          "alt": "Comedor de un restaurante de alta gama, con las mesas preparadas.",
          "size": "cover"
        },
        {
          "type": "tabs",
          "vertical": true,
          "items": [
            {
              "title": "Curaduría",
              "icon": "bottle",
              "text": "Seleccionar y comprar las etiquetas alineadas al concepto del establecimiento, siempre en coordinación con el Chef.",
              "reveal": {
                "at": 6.44,
                "effect": "pulse"
              }
            },
            {
              "title": "Gestión",
              "icon": "list",
              "text": "Controlar el inventario, la rotación de etiquetas y el mantenimiento óptimo de la cava.",
              "reveal": {
                "at": 10.34,
                "effect": "pulse"
              }
            },
            {
              "title": "Educar y educarse",
              "icon": "bulb",
              "text": "Mantenerse al día en el conocimiento del vino, las nuevas etiquetas y el [[Storytelling|storytelling]] para elevar la carta y el ticket promedio, además de aportar esa información al resto del equipo.",
              "reveal": {
                "at": 14.1,
                "effect": "pulse"
              }
            },
            {
              "title": "Venta",
              "icon": "dollar",
              "text": "Actuar como «vendedor altamente educado»: asesorar al comensal, dar un servicio pristino y aplicar [[Upselling|upselling]] para mejorar los rendimientos.",
              "reveal": {
                "at": 21.3,
                "effect": "pulse"
              }
            }
          ],
          "hint": "Haz clic sobre cada uno de los términos para descubrir.",
          "stacked": true
        }
      ],
      "storyboard": {
        "screen": "Screen 5",
        "objective": "[LO1] Explain and help the learner describe: Development 2 — The four core functions.",
        "brief": "Text of the titles of each category in monocle style (decorative) and filling the space. Utilize the same font as the one in the title of the slide. Icons appear when the VO mentions them. All icons aligned in tabs. Click on icon and tab displays message. When you click on other icon, the text of the other icon disappears and the text of the new icon pressed replaces it.",
        "visualRefs": "Monocle editorial design; premium infographic layouts; CruCo visual palette; editorial card / two-column layouts; clean interactive UI references.",
        "aiPrompt": "Four icons. Use the CruCo brand palette.",
        "vo": "Pasemos a explorar las cuatro funciones de vital importancia para el sommelier en el ámbito del restaurante: Curaduría. Gestión. Educar y educarse. Y quizás la más importante, la Venta.",
        "notes": [
          "Photo: Drive 'Restaurante.png' (1JO6MBQvBFycOZF670uMCd1chypmUY6DY), converted to JPEG for the web (2.3 MB -> 327 KB).",
          "Client 2026-09-18: of the two layouts tried, this one was chosen — the restaurant photo to the left of the list of functions. The other one was removed.",
          "Client 2026-09-18: icons — Curaduría a wine bottle (top half), Educar y educarse a clearer light bulb, Venta a dollar sign; all of them in the same gold, with no selection bar."
        ]
      },
      "asideFirst": true
    },
    {
      "id": "3.6",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "VO pendiente de producción para esta pantalla."
      },
      "blocks": [
        {
          "type": "quiz",
          "id": "ml02-clasificacion",
          "questions": [
            {
              "id": "funciones",
              "type": "categorize",
              "prompt": "Clasifica cada tarea en la función del sommelier que le corresponde.",
              "hint": "Clasifica cada tarea en la función del sommelier que corresponde.",
              "buckets": [
                "Curaduría",
                "Gestión",
                "Venta",
                "Educar(se)"
              ],
              "items": [
                {
                  "text": "Seleccionar y comprar etiquetas junto con el Chef.",
                  "bucket": "Curaduría"
                },
                {
                  "text": "Controlar el inventario y la rotación de la cava.",
                  "bucket": "Gestión"
                },
                {
                  "text": "Asesorar al comensal y aplicar upselling.",
                  "bucket": "Venta"
                },
                {
                  "text": "Mantenerse al día en nuevas etiquetas y storytelling.",
                  "bucket": "Educar(se)"
                }
              ],
              "feedback": {
                "correct": "¡Bien clasificado! Estas cuatro funciones son las que hacen del sommelier un activo indispensable.",
                "incorrect": "Inténtalo de nuevo."
              }
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 6",
        "objective": "[LO1] Reinforce the key ideas through an active-recall interaction.",
        "brief": "Categorization (drag items into 4 buckets) in Storyline style. New technique vs ML 1 (ordering) and ML 14 (matching) — keeps variety. Icon: question icon. When correct: cheering noise.",
        "visualRefs": "Monocle editorial design; premium infographic layouts; CruCo visual palette; clean interactive UI references.",
        "aiPrompt": "Categorization (drag items into 4 buckets) in Storyline. New technique vs ML 1 (ordering) and ML 14 (matching) — keeps variety (§5.8).",
        "vo": "(sin VO en el storyboard)",
        "notes": [
          "-Instruction classify- -> question hint; -Buckets:- / -Items to classify:- and the arrows are storyboard notation.",
          "Each card can be dragged or assigned from its own list, so the exercise also works with a keyboard and a screen reader.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): the 'Repasa la pantalla anterior…' line was removed; incorrect feedback is now only 'Inténtalo de nuevo.'"
        ]
      }
    },
    {
      "id": "3.7",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "VO pendiente de producción para esta pantalla."
      },
      "blocks": [
        {
          "type": "text",
          "text": "Repasemos otros conceptos vistos en este módulo."
        },
        {
          "type": "quiz",
          "id": "ml02-repaso",
          "questions": [
            {
              "id": "funcion-clave",
              "type": "single",
              "prompt": "Según la guía, ¿cuál es la función descrita como «quizá la más importante» del sommelier?",
              "hint": "Escoge la respuesta correcta.",
              "options": [
                {
                  "text": "A. La curaduría de la carta."
                },
                {
                  "text": "B. La gestión del inventario."
                },
                {
                  "text": "C. La venta del activo.",
                  "correct": true
                }
              ],
              "feedback": {
                "correct": "Correcto. La venta del activo es «quizá la función más importante»: el sommelier actúa como un vendedor altamente educado que mejora los rendimientos del negocio.",
                "incorrect": "Aunque la curaduría y la gestión son esenciales, señalamos la venta del activo como «quizá la función más importante» dado que te estás preparando para ser un activo esencial para el negocio."
              }
            },
            {
              "id": "donde-ejerce",
              "type": "multiple",
              "prompt": "¿En cuáles de estos lugares puede ejercer un sommelier profesional? Marca todas las que apliquen.",
              "hint": "Escoge todas las respuestas correctas:",
              "options": [
                {
                  "text": "Cruceros de lujo y resorts.",
                  "correct": true
                },
                {
                  "text": "Vinotecas y tiendas de vino (venta e importación).",
                  "correct": true
                },
                {
                  "text": "Como representante de marca o comprador.",
                  "correct": true
                },
                {
                  "text": "Como chef ejecutivo de cocina."
                }
              ],
              "feedback": {
                "correct": "Correcto. La carrera del sommelier va mucho más allá de la sala: hospitalidad, venta/importación y roles comerciales.",
                "incorrect": "Revisa: el sommelier ejerce en hospitalidad, venta/importación y roles comerciales (broker, comprador, representante de marca), pero no como chef de cocina."
              }
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 7",
        "objective": "[LO1] Check understanding of the key points.",
        "brief": "Icon: question icon. When correct: cheering noise.",
        "visualRefs": "Monocle editorial design; premium infographic layouts; CruCo visual palette.",
        "aiPrompt": "Premium editorial visual for 'Final questions'. Use the CruCo brand palette, clean modern editorial composition, refined and aspirational tone; avoid wine clichés.",
        "vo": "(sin VO en el storyboard v2)",
        "notes": [
          "Q1 multiple choice, Q2 multiple response, exactly as written in the storyboard.",
          "-(✓)- marks the correct option and is storyboard notation, not learner text.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): 'Repasemos otros conceptos vistos en este módulo.' moved from the VO column to the OST: shown on screen above the questions; the VO column is now empty."
        ]
      }
    },
    {
      "id": "3.8",
      "layout": "split",
      "asideFirstOnMobile": true,
      "title": "",
      "audio": {
        "src": "assets/audio/ml02/ml02-p8-mensaje-clave.mp3",
        "transcript": "La carrera del sommelier va mucho más allá de la sala. Saber dónde puedes ejercer y qué se espera de ti es el primer paso para convertirte en un activo indispensable."
      },
      "blocks": [
        {
          "type": "callout",
          "variant": "key",
          "band": true,
          "text": "Saber dónde puedes ejercer y qué se espera de ti es el primer paso para **convertirte en un activo indispensable.**",
          "reveal": {
            "at": 4.56,
            "effect": "write"
          }
        },
        {
          "type": "callout",
          "variant": "info",
          "title": "A continuación:",
          "text": "conozcamos cómo estas funciones se traducen en valor – rentabilidad, experiencia y prestigio.",
          "reveal": {
            "afterAudio": true,
            "effect": "rise"
          }
        },
        {
          "type": "image",
          "region": "aside",
          "src": "assets/images/ml01/ml01-p8-melina-aguirre.jpg",
          "alt": "Melina Aguirre Jaén, fundadora de CruCo Wine Studio.",
          "size": "circle",
          "reveal": {
            "at": 0.15,
            "effect": "fade"
          }
        }
      ],
      "storyboard": {
        "screen": "Screen 8",
        "objective": "CONCLUSION",
        "brief": "Founder face as in lesson 1 closing. Key message icon.",
        "visualRefs": "As ML01 closing screen.",
        "aiPrompt": "",
        "vo": "La carrera del sommelier va mucho más allá de la sala. Saber dónde puedes ejercer y qué se espera de ti es el primer paso para convertirte en un activo indispensable.",
        "notes": [
          "Same closing arrangement as ML01 screen 8: founder in a circle (first on a phone), key message in the gold box, 'A continuación:' below.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): new OST (key message + 'A continuación: …'); VO file linked (VO_M1-L2_Screen8.mp3, 11.9 s).",
          "Key message appears when the VO starts that sentence ('Saber dónde…', 4.56 s measured); 'A continuación' after the VO ends; the photo first, as in ML01.",
          "Client 2026-09-18: 'convertirte en un activo indispensable.' goes in bold (owner instruction; the storyboard v2 has no bold here, so update it in the original project).",
          "Client 2026-09-21: the CruCo ground is the background of this screen."
        ]
      },
      "background": {
        "brand": true
      }
    },
    {
      "id": "3.9",
      "layout": "centered",
      "title": "Lección completada",
      "audio": {
        "src": "",
        "transcript": "Has finalizado esta lección. ¡Sigamos!"
      },
      "blocks": [
        {
          "type": "reactions",
          "emojis": [
            "👏",
            "🎉",
            "👍",
            "⭐",
            "🙌"
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 9",
        "objective": "Completion",
        "brief": "Include emojis celebration closing.",
        "visualRefs": "",
        "aiPrompt": "",
        "vo": "Has finalizado esta lección. ¡Sigamos!",
        "notes": [
          "Same completion screen as ML01: title 'Lección completada' and emoji reactions; 'Has finalizado esta lección. ¡Sigamos!' is the VO (transcript), not on-screen text.",
          "Storyboard v2 (2026-09-17, sha1 0b02fbe3…): brief reworded ('Include emojis celebration closing.'); no VO file yet."
        ]
      }
    }
  ]
} /*</storyboard>*/);
