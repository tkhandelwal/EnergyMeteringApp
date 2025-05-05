// Models/Classification.cs
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EnergyMeteringApp.Models
{
    public class Classification
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; } // Equipment, Facility, ProductionLine, Organization, etc.

        [JsonIgnore]
        public List<MeteringData> MeteringData { get; set; } = new List<MeteringData>();
    }
}

// Models/MeteringData.cs
using System;
using System.Text.Json.Serialization;

namespace EnergyMeteringApp.Models
{
    public class MeteringData
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public double EnergyValue { get; set; } // kWh
        public double Power { get; set; } // kW
        public int ClassificationId { get; set; }

        public Classification Classification { get; set; }
    }
}

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