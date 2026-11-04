import { Response, NextFunction } from "express";
import { vi } from "vitest";

export function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: {} as Record<string, string>,
    cookies: {} as Record<string, any>,
  };

  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = vi.fn((data: any) => {
    res.body = data;
    return res;
  });

  res.cookie = vi.fn((name: string, value: any, options: any) => {
    res.cookies[name] = { value, options };
    return res;
  });

  res.clearCookie = vi.fn((name: string) => {
    delete res.cookies[name];
    return res;
  });

  res.setHeader = vi.fn((name: string, value: string) => {
    res.headers[name] = value;
    return res;
  });

  return res as Response & { statusCode: number; body: any; cookies: any };
}

