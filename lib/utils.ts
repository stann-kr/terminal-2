import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * clsx와 tailwind-merge를 결합하여 CSS 클래스 충돌을 근본적으로 해결하는 유틸리티입니다.
 * 부모로부터 전달된 클래스가 자식의 기본 클래스(폰트 크기 등)를 지능적으로 덮어씁니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
