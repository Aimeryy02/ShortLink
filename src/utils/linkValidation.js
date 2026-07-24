const { z } = require('zod');

const urlSchema = z
  .string({
    required_error: 'originalUrl is required',
    invalid_type_error: 'originalUrl must be a string',
  })
  .trim()
  .url('originalUrl must be a valid URL')
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  }, 'originalUrl must use http or https');

const aliasSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9-]+$/, 'Custom alias can only contain letters, numbers and dashes');

const tagsSchema = z.array(z.string().trim().min(1)).optional();

const shortenLinkSchema = z.object({
  originalUrl: urlSchema,
  title: z.string().trim().max(120).optional(),
  customAlias: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    aliasSchema.optional(),
  ),
  expiresAt: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.date().optional(),
  ),
});

const listLinksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', 'clicks', 'originalUrl', 'title', 'expiresAt'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(100).optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const rawTags = Array.isArray(value) ? value : value.split(',');
      return rawTags.map((tag) => tag.trim()).filter(Boolean);
    }),
});

const updateLinkSchema = z
  .object({
    originalUrl: urlSchema.optional(),
    title: z.string().trim().max(120).optional(),
    isActive: z.boolean().optional(),
    tags: tagsSchema,
    expiresAt: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.union([z.null(), z.coerce.date()]).optional(),
    ),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

module.exports = {
  listLinksQuerySchema,
  shortenLinkSchema,
  updateLinkSchema,
};
