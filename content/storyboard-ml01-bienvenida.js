/* =========================================================================
   Lección 1 · ¡Bienvenido!  (Screen 0 + Tutorial of the ML01 storyboard)
   -------------------------------------------------------------------------
   Source (approved, injected 2026-09-11):
     00-Storyboards-Aprobados/storyboard-ml01-rol-del-sommelier_Edited_VSCodeProject.pptx
     Google Drive id 1ePiVXCypmBPJAWqvOiYV-KvV_pcgTPZo · sha1 dd199e76a84ae281…
   The storyboard's OST numbers these screens "Lección 1 de 22" while the
   ML01 content starts at "Lección 2 de 22", so the welcome + tutorial are
   registered as their own lesson.
   Learner text is copied verbatim; English production notes live in
   `storyboard.notes` and are never rendered.
   Re-injected 2026-09-22 (sha1 0128a5f7621981d4…): the Tutorial screen has a
   new VO script and the links to the navigation video and its VO. The video
   carries the narration already, so the screen has no audio bar of its own and
   the script is the video's transcript.
   Pending media (owner): talking-head MP4 for screen 1 and the video captions.
   ========================================================================= */
CruCo.registerStoryboard(/*<storyboard>*/ {
  "id": "bienvenida",
  "kind": "intro",
  "module": {
    "id": "intro",
    "number": 1,
    "title": "Módulo introductorio"
  },
  "title": "¡Bienvenido!",
  "source": "storyboard-ml01-rol-del-sommelier_Edited_VSCodeProject.pptx (Screen 0 + Tutorial)",
  "screens": [
    {
      "id": "1.1",
      "layout": "centered",
      "title": "",
      "audio": {
        "src": "assets/audio/ml01/ml01-p0-bienvenida.mp3",
        "hidden": true,
        "transcript": "Acabas de iniciar el camino hacia convertirte en un Sommelier Profesional – con el Método CruCo, de la mano de CruCo Wine Studio!"
      },
      "blocks": [
        {
          "type": "banner",
          "alt": "CruCo. Wine Studio",
          "wide": true,
          "reveal": {
            "delay": 0,
            "effect": "fade",
            "duration": 5
          }
        },
        {
          "type": "spacer"
        },
        {
          "type": "text",
          "text": "🔊 Activa el audio",
          "reveal": {
            "delay": 0,
            "effect": "fade"
          }
        },
        {
          "type": "video",
          "title": "Video de bienvenida",
          "wide": true,
          "takesOver": true,
          "src": "",
          "poster": "",
          "captions": "assets/video/ml01/ml01-p0-video.vtt",
          "autoAdvance": true,
          "startAfterAudio": true,
          "reveal": {
            "afterAudio": true,
            "effect": "fade"
          },
          "script": "Soy Melina Aguirre Jaén, Sommelier y también Educadora con certificación internacional WSET.\n\nHe dedicado mi carrera a perfeccionar la hospitalidad de ultra-lujo en los escenarios más exigentes del mundo, desde el Armani Hotel y Atlantis The Palm en Dubái, hasta la formación de las tripulaciones de First Class de Emirates y Etihad Airways. Hoy, pongo toda esa experiencia internacional a tu disposición para elevarte profesionalmente.\n\nDurante este programa, te convertirás en un verdadero Estratega de Activos Líquidos. A lo largo de la experiencia lograrás identificar la base científica de la enología y la viticultura, ejecutar la coreografía de un servicio impecable en sala, analizar al consumidor para aplicar técnicas de venta sugestivas y gestionarás la rentabilidad de una cava.\n\nRecuerda siempre esto: en la alta hostelería el lujo es in-vi-si-ble, y la excelencia no es un acto, sino un hábito… que vas a adquirir. Estás a punto de obtener las credenciales y la estructura formal que transformarán tu carrera. ¡Comencemos!",
          "transcript": "Soy Melina Aguirre Jaén, Sommelier y también Educadora con certificación internacional WSET.\n\nHe dedicado mi carrera a perfeccionar la hospitalidad de ultra-lujo en los escenarios más exigentes del mundo, desde el Armani Hotel y Atlantis The Palm en Dubái, hasta la formación de las tripulaciones de First Class de Emirates y Etihad Airways. Hoy, pongo toda esa experiencia internacional a tu disposición para elevarte profesionalmente.\n\nDurante este programa, te convertirás en un verdadero Estratega de Activos Líquidos. A lo largo de la experiencia lograrás identificar la base científica de la enología y la viticultura, ejecutar la coreografía de un servicio impecable en sala, analizar al consumidor para aplicar técnicas de venta sugestivas y gestionarás la rentabilidad de una cava.\n\nRecuerda siempre esto: en la alta hostelería el lujo es in-vi-si-ble, y la excelencia no es un acto, sino un hábito… que vas a adquirir. Estás a punto de obtener las credenciales y la estructura formal que transformarán tu carrera. ¡Comencemos!"
        },
        {
          "type": "text",
          "text": "Melina Aguirre Jaén, Sommelier y Educadora con certificación internacional WSET",
          "wide": true,
          "takesOver": true,
          "reveal": {
            "afterAudio": true,
            "effect": "fade"
          }
        }
      ],
      "storyboard": {
        "screen": "Screen 0",
        "objective": "Motivation speech. Main objectives and learning outcomes.",
        "brief": "CruCo logo with VO here (7 Seconds). Transition to founder video <1 min (talking head). Automatically transitions to next slide when ending. Video should include option to be stopped, paused, change speed, activate CC.",
        "visualRefs": "Drive: M1_Screen0_Welcome.mp3 (VO, localizado) · M1-Screen0_TalkingHeadPlaceholder.mp4 (53 MB, pendiente de subir)",
        "vo": "Acabas de iniciar el camino hacia convertirte en un Sommelier Profesional – con el Método CruCo, de la mano de CruCo Wine Studio!",
        "notes": [
          "CruCo logo with VO here (7 Seconds)",
          "Transition to founder video <1 min (talking head). Here: placeholder here",
          "Automatically transitions to next slide when ending",
          "Video should include option to be stopped, paused, change speed, activate CC",
          "Client 2026-09-21: the opening screen leads with a 3:1 brand banner (CruCo ground + white lockup, as on crucowine.com); the word '¡Bienvenido!' is gone but its space is kept, and more air was added under the banner."
        ]
      },
      "titleSpacer": true
    },
    {
      "id": "1.2",
      "layout": "split",
      "asideFirst": true,
      "title": "Cómo navegar por la plataforma.",
      "blocks": [
        {
          "type": "video",
          "region": "aside",
          "title": "Video de navegación",
          "src": "assets/video/ml01/ml01-p2-navegacion.mp4",
          "aspect": "9/16",
          "autoplay": true,
          "transcript": "¡Presta atención! Te daremos unas pocas instrucciones para ayudarte a navegar por la plataforma, ¡aunque es muy intuitivo!\n\nEn general, las pantallas de esta experiencia te resultarán parecidas… aunque con algunas diferencias. ¡Te explico!\n\nEn la parte superior verás el título de la experiencia en la que estás, en qué lección te encuentras y el progreso.\n\nCuando haya sonido, este se activará automáticamente. Verás la barra de audio para que puedas detenerlo, aumentar o disminuir la velocidad, o incluso leer la transcripción del texto en esta píldora si no quieres escucharlo.\n\nSi la pantalla es interactiva, no tienes más que leer qué es lo que debes hacer. ¡Y ya está! Por ejemplo, aquí hacemos clic para descubrir el contenido.\n\nPara continuar a la siguiente pantalla, debes finalizar el contenido y hacer clic en los botones que están en la parte inferior, ya sea a la izquierda o a la derecha.\n\nY por último, arriba a la izquierda encontrarás el menú de navegación. Allí te saldrá toda la tabla de contenidos y, en la parte de abajo, verás que se encuentran los materiales que podrás descargar para leerlos o repasarlos cuando quieras, la Wiki para explorar términos desconocidos, y la barra de ayuda por si necesitas contactar con el equipo de CruCo. Ya que sabes cómo navegar, ¡vamos!",
          "script": "Video de navegación editado por el cliente (2026-09-22): M1_L0-ScreenTutorial_VideoNavegaciónCruCo.mp4, vertical 1080x1920, 70 s, con la locución ya incorporada."
        },
        {
          "type": "text",
          "text": "Sigue el orden establecido para completar la experiencia. Cada pantalla completada te permitirá avanzar a la siguiente y podrás continuar donde lo dejaste."
        },
        {
          "type": "callout",
          "variant": "info",
          "text": "Las actividades no son calificables: si te equivocas, pulsa **Repetir** e inténtalo de nuevo. No necesitas acertar para avanzar."
        }
      ],
      "storyboard": {
        "screen": "Tutorial",
        "objective": "How to.",
        "brief": "Navigation video here: Not available. Produce when first page is approved.",
        "vo": "Presta atención: estas breves instrucciones te ayudarán a navegar por la plataforma. A la izquierda está el menú principal con las lecciones disponibles y tu progreso. Sigue el orden establecido para completar la experiencia. Podrás reiniciar una lección o continuar donde la dejaste cuando quieras. En la parte superior verás la lección en la que te encuentras. Desplázate hacia arriba para volver al contenido anterior y hacia abajo para continuar. Cada lección completada te permitirá avanzar a la siguiente. Presta atención a las instrucciones de cada actividad ya que cada una requerirá que hagas algo distinto. Sólo sigue los pasos. Al final del menú principal encontrarás el apartado DESCARGAS con los materiales de cada módulo, la Wiki para revisar la terminología utilizada y la sección de AYUDA si la necesitas.  Ya que sabes como moverte por la plataforma, ¡sigamos!",
        "notes": [
          "Owner 2026-09-15: do NOT use the navigation video, it will be edited; the slot only shows in editor mode.",
          "On-screen navigation guidance is interface microcopy written for THIS player (buttons + menu), not storyboard content: the original VO describes scroll navigation.",
          "Navigation video here: Not available. Produce when first page is approved"
        ]
      }
    }
  ],
  "glossary": [],
  "downloads": []
} /*</storyboard>*/);
