pragma solidity ^0.8.0;

contract HospitalChain {
    // ... (Your other struct definitions, e.g., Doctor, Patient) ...

    struct HistoryRecord {
        string doctorName;
        string disease;
        uint256 timestamp;
        string prescriptionText; // NEW: Stores the full text
    }

    mapping(string => HistoryRecord[]) public patientHistory;
    // ... (Your other mappings and state variables) ...

    // Function to add history now takes prescriptionText
    function addHistory(
        string memory _patientId,
        string memory _doctorName,
        string memory _disease,
        string memory _prescriptionText
    ) public {
        // NOTE: Add security checks here (e.g., only Doctor can call)

        patientHistory[_patientId].push(
            HistoryRecord(_doctorName, _disease, block.timestamp, _prescriptionText)
        );
    }

    // Function to retrieve history
    function getHistory(string memory _patientId) public view returns (HistoryRecord[] memory) {
        // NOTE: Add security checks here (e.g., only Doctor/Patient can call)
        return patientHistory[_patientId];
    }

    // ... (Your other functions, e.g., register, login) ...
}