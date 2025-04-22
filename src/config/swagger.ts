import swaggerJsdoc from 'swagger-jsdoc';
import packageJson from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinic API Documentation',
      version: packageJson.version, // Wersja z package.json
      description: `Dokumentacja REST API dla aplikacji Clinic. \n\n**Środowiska:** Możesz wybrać środowisko API z listy serwerów poniżej. \n\n**Autentykacja:** Większość endpointów (poza /auth/*) wymaga uwierzytelnienia za pomocą tokenu JWT Bearer. Należy go dołączyć w nagłówku 'Authorization'.`,
      contact: { name: 'Zespół Developerski', email: 'dev@example.com' }, // Zmień na prawdziwe dane
      license: {
        // Opcjonalnie
        name: 'Licencja (np. MIT)',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      // Przykładowe serwery - dodaj swoje
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`, // Użyj zmiennej PORT i dodaj /api/v1
        description: 'Lokalny serwer deweloperski (v1)',
      },
      {
        url: 'https://staging.twoja-domena.com/api/v1', // Dodaj URL stagingu
        description: 'Środowisko Staging (v1)',
      },
      {
        url: 'https://api.twoja-domena.com/api/v1', // Dodaj URL produkcji
        description: 'Produkcja (v1)',
      },
    ],
    // === Komponenty ===
    components: {
      // Schematy reużywalne w wielu miejscach
      schemas: {
        // Ogólny schemat dla odpowiedzi błędów
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Status odpowiedzi (np. "fail", "error").',
              example: 'fail',
            },
            statusCode: { type: 'integer', description: 'Kod statusu HTTP.', example: 400 },
            message: {
              type: 'string',
              description: 'Główny opis błędu.',
              example: 'Validation failed',
            },
            errors: {
              // Przykładowe pole na szczegóły błędów walidacji
              type: 'object',
              description: '(Opcjonalne) Szczegółowe błędy walidacji dla poszczególnych pól.',
              additionalProperties: { type: 'string' }, // Pozwala na dowolne klucze (nazwy pól) z opisem błędu
              example: { email: 'Podaj prawidłowy adres email', password: 'Hasło jest wymagane' },
            },
            stack: {
              type: 'string',
              description: '(Tylko w trybie deweloperskim) Stos wywołań błędu.',
              example: 'Error: Validation failed\n    at ...',
            },
          },
          required: ['status', 'statusCode', 'message'],
        },
        // Podstawowe informacje o użytkowniku (do ponownego użycia w różnych odpowiedziach)
        BaseUserInfo: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Unikalny identyfikator użytkownika.', example: 5 },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adres email użytkownika.',
              example: 'test@example.com',
            },
            role: {
              type: 'string',
              description: 'Rola użytkownika w systemie.',
              example: 'user',
              enum: ['user', 'admin', 'doctor'],
            }, // Użyj enum dla zdefiniowanych ról
          },
          required: ['id', 'email', 'role'],
        },
      },
      // Definicje schematów bezpieczeństwa (np. dla JWT)
      securitySchemes: {
        bearerAuth: {
          // Nazwa, której będziesz używać w `security`
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            "Token JWT uzyskany podczas logowania. Wartość należy podać w formacie: 'Bearer {token}'.",
        },
      },
    },
    // Definicja globalnych wymagań bezpieczeństwa (jeśli większość endpointów wymaga JWT)
    // Można to nadpisać lub pominąć w poszczególnych endpointach (np. login, register)
    security: [
      {
        bearerAuth: [], // Pusta tablica oznacza brak wymaganych konkretnych scope'ów (uprawnień)
      },
    ],
    // Definicja globalnych tagów (grupowania endpointów)
    tags: [
      {
        name: 'Autentykacja',
        description: 'Operacje związane z logowaniem, rejestracją, odświeżaniem tokenu.',
      },
      { name: 'Użytkownicy', description: 'Zarządzanie użytkownikami (wymaga uprawnień admina).' },
      { name: 'Wizyty', description: 'Operacje związane z wizytami lekarskimi.' },
      // Dodaj inne tagi w miarę potrzeb
    ],
  },
  // Ścieżki do plików, które `swagger-jsdoc` ma przeskanować w poszukiwaniu `@openapi`
  // Bądź precyzyjny, aby nie skanować niepotrzebnych plików. Uwzględnij kontrolery i pliki DTO/schematów, jeśli tam definiujesz komponenty.
  apis: [
    './src/modules/**/*.controller.ts',
    './src/modules/**/*.dto.ts', // Jeśli definiujesz schematy w plikach DTO
    './src/routes/**/*.ts', // Jeśli definicje są bezpośrednio w plikach routingu
  ],
};

export const openapiSpecification = swaggerJsdoc(options);
