"use server";

export async function verifyDirectorPin(pin: string) {
  return pin === process.env.DIRECTOR_PIN;
}

export async function verifyPosgradoPin(pin: string) {
  return pin === process.env.POSGRADO_PIN;
}

