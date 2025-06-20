import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class QueryArrayTransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'query' && value && typeof value === 'object') {
      const transformed = { ...value };

      // Transform array query parameters from roles[] to roles
      const arrayFields = [
        'roles',
        'skills',
        'cities',
        'countries',
        'fields',
        'institutions',
        'universities',
        'graduationYears',
        'availability',
        'visibility',
        'studentIds',
      ];

      arrayFields.forEach((field) => {
        const arrayKey = `${field}[]`;
        if (transformed[arrayKey]) {
          transformed[field] = transformed[arrayKey];
          delete transformed[arrayKey];
        }
      });

      return transformed;
    }

    return value;
  }
}
