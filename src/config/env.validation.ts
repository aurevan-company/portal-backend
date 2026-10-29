import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  DB_HOST = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = 5432;

  @IsString()
  DB_USERNAME = '';

  @IsString()
  DB_PASSWORD = '';

  @IsString()
  DB_DATABASE = '';

  @IsString()
  JWT_SECRET = '';

  @IsString()
  JWT_REFRESH_SECRET = '';

  @IsString()
  JWT_EXPIRES_IN = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsIn(['local', 's3'])
  FILE_STORAGE_DRIVER = 'local';

  @IsString()
  FILE_STORAGE_ROOT = './private-uploads';

  @IsInt()
  @Min(1)
  @Max(100)
  MAX_FILE_SIZE_MB = 10;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const transformed = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      PORT: Number(config.PORT ?? 3000),
      DB_PORT: Number(config.DB_PORT ?? 5432),
      MAX_FILE_SIZE_MB: Number(config.MAX_FILE_SIZE_MB ?? 10),
    },
    { enableImplicitConversion: true },
  );

  const errors = validateSync(transformed, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration: ${errors
        .map(
          (error) =>
            `${error.property} (${Object.keys(error.constraints ?? {}).join(', ')})`,
        )
        .join('; ')}`,
    );
  }

  return transformed;
}
