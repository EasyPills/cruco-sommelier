/* =========================================================================
   Lección 2 · ML01 — El rol del sommelier: del servicio a la estrategia
   -------------------------------------------------------------------------
   Source (approved, injected 2026-09-11):
     00-Storyboards-Aprobados/storyboard-ml01-rol-del-sommelier_Edited_VSCodeProject.pptx
     Google Drive id 1ePiVXCypmBPJAWqvOiYV-KvV_pcgTPZo · sha1 dd199e76a84ae281…
     Header: "CRUCO STORYBOARD | ML01 · El rol del sommelier: del servicio a
     la estrategia | Duración estimada: 5-6 min". Screens 1-9.

   Storyboard notation removed from learner text (kept in `storyboard.notes`):
     -Instruction- / -Feedback-   labels for the instruction and feedback text
     "→"                          marks the answer / reveal line
     "✓ «…»"                      marks the correct-answer feedback
   Owner decisions (2026-09-15): "gestion" corrected to "gestión";
   the ordering check keeps the storyboard's single (correct) feedback text.
   VO audio exists for screens 1, 3 and 8; the other screens carry an empty
   audio slot with the VO text, ready to receive the file from the editor.
   ========================================================================= */
CruCo.registerStoryboard(/*<storyboard>*/ {
  "id": "ml01",
  "title": "El rol del sommelier: del servicio a la estrategia",
  "lesson": 1,
  "point": {
    "number": 1,
    "title": "Rol del sommelier y áreas de acción"
  },
  "duration": "~ 3 min",
  "module": {
    "id": "intro",
    "number": 1,
    "title": "Módulo introductorio"
  },
  "source": "storyboard-ml01-rol-del-sommelier_Edited_VSCodeProject.pptx (Screens 1-9)",
  "glossary": [],
  "screens": [
    {
      "id": "2.1",
      "layout": "centered",
      "eyebrow": "Lección 1 · Módulo 1",
      "title": "El rol del sommelier: del servicio a la estrategia",
      "background": {
        "src": "assets/images/ml01/ml01-p1-fondo-copa.jpg",
        "alt": "",
        "layout": "light"
      },
      "avatar": {
        "src": "assets/images/ml01/ml01-p8-melina-aguirre.jpg",
        "alt": "Melina Aguirre Jaén, quien presenta esta lección."
      },
      "audio": {
        "src": "assets/audio/ml01/ml01-p1-vo.mp3",
        "transcript": "Descubramos por qué el sommelier moderno es mucho más que quien sirve el vino. Al final de esta lección comprenderás mejor **la evolución de este rol, lo que te ayudará a enriquecer tus conversaciones sobre vino**."
      },
      "blocks": [
        {
          "type": "callout",
          "variant": "objective",
          "wide": true,
          "text": "Comprenderás **la evolución de este rol, lo que te ayudará a enriquecer tus conversaciones sobre vino**.",
          "reveal": {
            "at": 5.7,
            "effect": "write"
          }
        }
      ],
      "storyboard": {
        "screen": "Screen 1",
        "objective": "Open the course: position the sommelier as a strategic role and set an aspirational tone.",
        "brief": "TEXT based screen. VO starts with the new screen. The text \"comprenderás\" written, shows when the VO says \"comprenderás\".",
        "visualRefs": "Premium course title cards; minimal editorial typography.",
        "aiPrompt": "Refined editorial title card.",
        "vo": "Descubramos por qué el sommelier moderno es mucho más que quien sirve el vino. Al final de esta lección comprenderás mejor la evolución de este rol, lo que te ayudará a enriquecer tus conversaciones sobre vino.",
        "notes": [
          "The text 'comprenderás' written, shows when the VO says 'comprenderás' -> reveal at 5.7 s, measured on M1_Screen1.mp3 (11.5 s). Adjust here if the VO is re-recorded.",
          "Client 2026-09-15: founder in a small circle on top, learning objective in a navy rounded box, and a background photo on trial (Drive 1Ln1NOt004kjGyR-Z5VQKWU-0_RwQdlDG)."
        ]
      }
    },
    {
      "id": "2.2",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "VO pendiente de producción para esta pantalla."
      },
      "blocks": [
        {
          "type": "quiz",
          "id": "ml01-enganche",
          "questions": [
            {
              "id": "hook",
              "type": "single",
              "prompt": "¿Qué crees que protege hoy un sommelier en un restaurante?",
              "hint": "Escoge la respuesta correcta.",
              "revealCorrect": true,
              "options": [
                {
                  "text": "A. La calidad del vino que se sirve."
                },
                {
                  "text": "B. La salud financiera del negocio y la experiencia del cliente.",
                  "correct": true
                },
                {
                  "text": "C. La temperatura de la cava."
                }
              ],
              "feedback": {
                "correct": "Las tres importan… pero la respuesta estratégica es la B. Veamos por qué.",
                "incorrect": "Las tres importan… pero la respuesta estratégica es la B. Veamos por qué."
              }
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 2",
        "objective": "Activate prior beliefs about what a sommelier protects today (ungraded hook).",
        "brief": "Interaction: tap-and-reveal. Three answer cards; on reveal, highlight option B. No scoring. Close-but-authoritative tone. Icon: question icon. When correct: cheering noise.",
        "visualRefs": "Clean quiz UI; editorial multiple-choice cards; subtle reveal animation.",
        "aiPrompt": "Minimal multiple-choice card UI with 3 options and a soft highlight-reveal on the correct option, editorial and uncluttered.",
        "vo": "(sin VO en el storyboard)",
        "notes": [
          "-Instruction- -> question hint; -Feedback- and the leading arrow are storyboard notation, not learner text.",
          "Same feedback text for correct and incorrect: the storyboard gives one reveal line for this ungraded hook.",
          "When correct: cheering noise -> SFX in courseConfig (placeholder chime)."
        ]
      }
    },
    {
      "id": "2.3",
      "layout": "cover",
      "background": {
        "src": "assets/images/ml01/ml01-p3-sommelier-botella.jpg",
        "alt": "",
        "layout": "side"
      },
      "title": "",
      "audio": {
        "src": "assets/audio/ml01/ml01-p3-mensaje-clave.mp3",
        "transcript": "Tal vez imaginas a un sommelier como alguien que descorcha botellas y describe sabores. Pero… su verdadero rol va mucho más allá de la copa: **conecta la cava con cada comensal y protege la salud financiera del negocio.**"
      },
      "blocks": [
        {
          "type": "callout",
          "variant": "key",
          "band": true,
          "text": "El sommelier **conecta la cava con cada comensal y protege la salud financiera del negocio.**"
        },
        {
          "type": "text",
          "text": "¿Cómo pasó de catador a estratega clave de la rentabilidad y la experiencia del cliente?"
        }
      ],
      "storyboard": {
        "screen": "Screen 3",
        "objective": "Frame the micro-learning: the sommelier evolved from taster to strategist.",
        "brief": "Main background image of sommelier showing a bottle. VO here. Icon: Key message icon.",
        "visualRefs": "Editorial kinetic typography; documentary-style intros; premium e-learning openers. Drive: M1-Screen3-Background_Image.png, M1_Screen3_KeyMessage.mp3.",
        "aiPrompt": "Subtle kinetic-typography intro animation emphasizing 'conecta la cava--- to ---- financiera del negocio', minimalist, CruCo palette, refined and calm.",
        "vo": "Tal vez imaginas a un sommelier como alguien que descorcha botellas y describe sabores. Pero… su verdadero rol va mucho más allá de la copa: conecta la cava con cada comensal y protege la salud financiera del negocio.",
        "notes": [
          "Background photo is decorative (alt empty): the key message carries the meaning."
        ]
      }
    },
    {
      "id": "2.4",
      "title": "El rol del sommelier ha cambiado según las necesidades de cada época.",
      "audio": {
        "src": "",
        "transcript": "Desde el copero egipcio hasta el estratega actual, el oficio ha evolucionado para proteger hoy la rentabilidad del negocio y la experiencia del cliente."
      },
      "blocks": [
        {
          "type": "flipcards",
          "variant": "timeline",
          "cards": [
            {
              "image": {
                "src": "assets/images/ml01/ml01-p4-rol-1.png",
                "alt": "Copero egipcio"
              },
              "back": "**Copero egipcio:**\nprobaba el vino antes que el rey evitando envenenamientos."
            },
            {
              "image": {
                "src": "assets/images/ml01/ml01-p4-rol-2.png",
                "alt": "Maestro de ceremonias griego"
              },
              "back": "**Maestro de ceremonias griego:**\nhacía la preparación; mezclaba vino y agua en los simposios."
            },
            {
              "image": {
                "src": "assets/images/ml01/ml01-p4-rol-3.png",
                "alt": "Custodio medieval"
              },
              "back": "**Custodio medieval:**\nguardaba la llave de la cava de vinos."
            },
            {
              "image": {
                "src": "assets/images/ml01/ml01-p4-rol-4.png",
                "alt": "Gestor moderno"
              },
              "back": "**Gestor moderno:**\ncontrolaba el inventario y el protocolo de servicio."
            },
            {
              "image": {
                "src": "assets/images/ml01/ml01-p4-rol-5.png",
                "alt": "Estratega de Activos Líquidos"
              },
              "back": "**Estratega de Activos Líquidos:**\nvigila la salud financiera del negocio y la experiencia del cliente."
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 4",
        "objective": "Identify the historical evolution of the sommelier's role and its transition into a strategic business function.",
        "brief": "Main Image: Clickable timeline with evolution of the sommelier's role. Dominant Visual Element: evolutionary timeline connecting all eras. Include clickable visuals with the title of each behind.",
        "visualRefs": "Monocle editorial design; Financial Times data visualization and graphics; premium editorial infographic layouts; contemporary museum exhibition and wayfinding design. Drive folder: M1_Screen4_Roles.",
        "aiPrompt": "Create an animation portraying the evolution of the sommelier through distinct eras: Egyptian cupbearer, Greek symposium master, medieval cellar keeper, modern sommelier, and contemporary wine strategist. Use clean compositions, elegant transitions, and CruCo's palette.",
        "vo": "Desde el copero egipcio hasta el estratega actual, el oficio ha evolucionado para proteger hoy la rentabilidad del negocio y la experiencia del cliente.",
        "notes": [
          "The OST bullet list is rendered as the clickable timeline: each era name sits behind its illustration.",
          "Client 2026-09-16: each card back now carries a short description of the role, text supplied by the owner (update the storyboard in the original project to match)."
        ]
      }
    },
    {
      "id": "2.5",
      "layout": "split",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "Hoy el sommelier protege dos cosas que no se ven: la salud financiera del negocio y la experiencia del cliente. Y conecta las bodegas del mundo con cada comensal."
      },
      "blocks": [
        {
          "type": "cards",
          "columns": 2,
          "items": [
            {
              "title": "El sommelier PROTEGE:",
              "text": "- La salud financiera del establecimiento\n- La integridad de la experiencia del comensal"
            },
            {
              "title": "El sommelier CONECTA:",
              "text": "- El activo (la cava) con el comensal\n- Las bodegas del mundo con el consumidor"
            }
          ]
        },
        {
          "type": "callout",
          "variant": "quote",
          "outline": true,
          "text": "«El Sommelier actual es el heredero de esa confianza histórica, transformándola en gestión técnica, rentabilidad y excelencia en el servicio.»"
        },
        {
          "type": "image",
          "region": "aside",
          "src": "assets/images/ml01/ml01-p5-esferas-rentabilidad-experiencia.jpg",
          "alt": "Dos manos sostienen sendas esferas de cristal: en una se ve el salón de un restaurante; en la otra, monedas apiladas."
        }
      ],
      "storyboard": {
        "screen": "Screen 5",
        "objective": "Explain what the modern sommelier protects (financial health, guest experience) and connects (cellar <-> guest, wineries <-> market).",
        "brief": "Visual of two hands in front of a person, each hand holding a magic sphere, one with a money bubble and the other with a restaurant bubble. Support image here.",
        "visualRefs": "Editorial two-column layouts; premium pull-quote design; finance-meets-hospitality iconography. Drive: M1-Screen5_Support visual.png.",
        "aiPrompt": "Two-card 'Protect vs Connect' editorial layout with a refined pull-quote callout and a finance-and-hospitality icon set, CruCo palette, premium and clean.",
        "vo": "Hoy el sommelier protege dos cosas que no se ven: la salud financiera del negocio y la experiencia del cliente. Y conecta las bodegas del mundo con cada comensal.",
        "notes": [
          "OST bullets kept verbatim as lists inside the two cards."
        ]
      }
    },
    {
      "id": "2.6",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "Te toca a ti: ordena las cinco etapas, del pasado al presente."
      },
      "blocks": [
        {
          "type": "quiz",
          "id": "ml01-orden-evolucion",
          "questions": [
            {
              "id": "orden",
              "type": "ordering",
              "prompt": "Ordena la evolución del rol del sommelier, del pasado al presente:",
              "items": [
                "Copero",
                "Maestro de ceremonias",
                "Custodio",
                "Gestor moderno",
                "Estratega de Activos Líquidos"
              ],
              "feedback": {
                "correct": "¡Exacto! El oficio evolucionó de garantizar la seguridad del rey a garantizar la rentabilidad del negocio.",
                "incorrect": ""
              }
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 6",
        "objective": "Recall the evolution sequence through an ordering interaction (active recall).",
        "brief": "Interaction: drag-and-drop ordering of the five eras, with correct/incorrect feedback states. Icon: question icon. When correct: cheering noise.",
        "visualRefs": "Clean drag-and-drop UI; editorial timeline tokens.",
        "aiPrompt": "Five draggable timeline tokens (one per era) with ordered drop slots and clear correct/incorrect feedback, CruCo palette, editorial and tactile.",
        "vo": "Te toca a ti: ordena las cinco etapas, del pasado al presente.",
        "notes": [
          "The storyboard has no text for the incorrect state; owner decision 2026-09-15: leave as is (only the 'Incorrecto' title + Repetir).",
          "Drag & drop implemented with pointer events; the up/down buttons stay for keyboard and screen readers."
        ]
      }
    },
    {
      "id": "2.7",
      "title": "",
      "audio": {
        "src": "",
        "transcript": "Una pregunta rápida para afianzar lo aprendido. Responde verdadero o falso."
      },
      "blocks": [
        {
          "type": "quiz",
          "id": "ml01-verdadero-falso",
          "questions": [
            {
              "id": "vf",
              "type": "truefalse",
              "prompt": "El sommelier moderno protege, principalmente, la salud financiera y la experiencia del comensal.",
              "answer": true,
              "feedback": {
                "correct": "El sommelier conecta y protege.",
                "incorrect": "El sommelier conecta y protege."
              }
            }
          ]
        }
      ],
      "storyboard": {
        "screen": "Screen 7",
        "objective": "Check identification of the historical role and the modern benefit.",
        "brief": "True/false item. Standard Rise quiz blocks. Icon: question icon. When correct: cheering noise.",
        "visualRefs": "Clean assessment UI; editorial feedback panels.",
        "aiPrompt": "Clean knowledge-check screen with a true/false item, each with a descriptive feedback panel, CruCo palette, uncluttered.",
        "vo": "Una pregunta rápida para afianzar lo aprendido. Responde verdadero o falso.",
        "notes": [
          "The storyboard gives one feedback line, used for both states."
        ]
      }
    },
    {
      "id": "2.8",
      "layout": "split",
      "asideFirstOnMobile": true,
      "title": "",
      "audio": {
        "src": "assets/audio/ml01/ml01-p8-mensaje-clave.mp3",
        "transcript": "Recuerda: el sommelier es, ante todo, un estratega.\n\nEn el próximo tema verás dónde ejerce y cuáles son sus cuatro áreas de acción.\n\nNo olvides también, que te mandaremos alguna preguntita por WhatsApp."
      },
      "blocks": [
        {
          "type": "callout",
          "variant": "key",
          "band": true,
          "text": "El sommelier dejó de ser un catador para convertirse en un estratega: **protege la rentabilidad y eleva la experiencia, conectando la cava con cada comensal.**",
          "reveal": {
            "at": 1.2,
            "effect": "write"
          }
        },
        {
          "type": "callout",
          "variant": "info",
          "title": "A continuación:",
          "text": "Dónde ejerce y sus cuatro áreas de acción: curaduría, gestión, educación y venta.",
          "reveal": {
            "at": 3.6,
            "effect": "rise"
          }
        },
        {
          "type": "badge",
          "icon": "whatsapp",
          "text": "WhatsApp",
          "reveal": {
            "at": 10.5,
            "effect": "fade"
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
        "objective": "Synthesize the role and bridge to the next micro-learning (areas of action).",
        "brief": "Short closing card + bridge teaser. Owner image in who is providing the final key message appears when the text phrase has fully appeared. VO key message here. Owner image here. Icon: Key message icon. Icon: WhatsApp icon. DO NOT EXECUTE THIS: The micro-challenge can be exported as a standalone WhatsApp card. Microchallenge (WhatsApp): «En una frase, ¿qué protege hoy un sommelier?»",
        "visualRefs": "Editorial closing slides; WhatsApp share-card templates. Drive: M1_Screen8_KeyMessage.mp3, owner photo.",
        "aiPrompt": "Concise closing card with a one-line synthesis and a small 'next up' teaser, plus a shareable WhatsApp challenge card, CruCo palette, refined.",
        "vo": "Recuerda: el sommelier es, ante todo, un estratega. En el próximo tema verás dónde ejerce y cuáles son sus cuatro áreas de acción. No olvides también, que te mandaremos alguna preguntita por WhatsApp.",
        "notes": [
          "DO NOT EXECUTE: WhatsApp micro-challenge card is not built (storyboard instruction).",
          "Owner typo corrected on request 2026-09-15: 'gestion' -> 'gestión' (also fix it in the source storyboard).",
          "WhatsApp icon shown as a small badge when the VO reaches that line (10.5 s of 13.9 s).",
          "Client 2026-09-15: owner photo in a circle without a frame, and first in the reading order on phones.",
          "Client 2026-09-21: the CruCo ground is the background of this screen."
        ]
      },
      "background": {
        "brand": true
      }
    },
    {
      "id": "2.9",
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
        "objective": "Completion.",
        "brief": "Include a sort of emoji reaction to the screen (similar to a reaction on a teams call).",
        "vo": "Has finalizado esta lección. ¡Sigamos!",
        "notes": []
      }
    }
  ],
  "downloads": []
} /*</storyboard>*/);
