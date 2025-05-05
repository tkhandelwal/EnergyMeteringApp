// Models/EnPI.cs (Energy Performance Indicator)
namespace EnergyMeteringApp.Models
{
    public class EnPI
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Formula { get; set; }
        public double BaselineValue { get; set; }
        public double CurrentValue { get; set; }
        public DateTime CalculationDate { get; set; }
        public int ClassificationId { get; set; }
        public Classification Classification { get; set; }
    }
}