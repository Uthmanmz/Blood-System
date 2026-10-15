function BloodCard({ bloodGroup, available }) {
  return (
    <div className="blood-card">
      <div className="blood-group">{bloodGroup}</div>

      <p className={available ? "available" : "not-available"}>
        {available ? "Available" : "Not Available"}
      </p>
    </div>
  );
}

export default BloodCard;