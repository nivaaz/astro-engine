export type SaturnFormErrors = Readonly<{
  date: string;
  city: string;
  time: string;
}>;

export function validateSaturnReturnForm({
  date,
  citySelected,
}: Readonly<{ date: string; citySelected: boolean }>): SaturnFormErrors {
  return {
    date: date === "" ? "Enter your birth date." : "",
    city: citySelected ? "" : "Choose a supported major city from the list.",
    time: "",
  };
}
