﻿// Models/SyntheticDataRequest.cs
namespace EnergyMeteringApp.Models
{
    public class SyntheticDataRequest
    {
        public int ClassificationId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int IntervalMinutes { get; set; } = 15; // Default 15-minute intervals
        public double BaseValue { get; set; } = 10.0; // Base energy consumption in kWh
        public double Variance { get; set; } = 2.0; // Random variance amount
    }
}