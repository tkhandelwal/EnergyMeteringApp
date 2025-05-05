// Models/Classification.cs
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EnergyMeteringApp.Models
{
    public class Classification
    {
        public int Id { get; set; }

        // Fix 1: Add required modifier to enforce non-null values
        public required string Name { get; set; }

        // Fix 2: Add required modifier to enforce non-null values
        public required string Type { get; set; } // Equipment, Facility, ProductionLine, Organization, etc.

        [JsonIgnore]
        public List<MeteringData> MeteringData { get; set; } = new List<MeteringData>();
    }
}