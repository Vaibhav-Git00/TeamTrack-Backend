# 🧪 Testing Group-Based Team Management

## ✅ Features Implemented

### Backend Changes:
1. **Team Model Updated**: Added `group` field (required, enum: G1-G10)
2. **Team Creation API**: Now requires `group` parameter
3. **New API Endpoints**:
   - `GET /api/teams/groups` - Get all groups with team counts
   - `GET /api/teams/group/:groupName` - Get teams by specific group

### Frontend Changes:
1. **Student Dashboard**: 
   - Group dropdown in team creation form
   - Group badges displayed on team cards
2. **Mentor Dashboard**:
   - New "Teams by Group" tab
   - Group selection dropdown with team/member counts
   - Group-filtered team display

## 🚀 How to Test

### 1. Test Student Functionality:
1. **Register/Login as Student**
   - Go to http://localhost:3000
   - Register with role "Student"

2. **Create Team with Group**:
   - Click "Create Team"
   - Fill in:
     - Team Name: "Frontend Team"
     - Group: "G1" (from dropdown)
     - Team Size: 4
     - Description: "Working on React components"
   - Click "Create Team"
   - ✅ Should see team created with G1 badge

3. **Create Another Team**:
   - Create another team in "G2"
   - Name: "Backend Team"
   - Group: "G2"

### 2. Test Mentor Functionality:
1. **Register/Login as Mentor**
   - Register with role "Mentor"

2. **View Teams by Group**:
   - Go to "Teams by Group" tab
   - Select "G1" from dropdown
   - ✅ Should see only G1 teams
   - Select "G2" from dropdown
   - ✅ Should see only G2 teams

3. **Monitor Teams**:
   - Click "Start Monitoring" on any team
   - Go to "Monitoring Teams" tab
   - ✅ Should see monitored teams with group badges

## 🔍 API Testing (Optional)

### Test with curl/Postman:

1. **Get Groups with Counts**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5001/api/teams/groups
```

2. **Get Teams by Group**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5001/api/teams/group/G1
```

3. **Create Team with Group**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Team","group":"G1","size":4,"description":"Test"}' \
     http://localhost:5001/api/teams
```

## ✅ Expected Results

### Student Dashboard:
- ✅ Group dropdown in team creation form
- ✅ Teams display with group badges (G1, G2, etc.)
- ✅ Team creation requires group selection

### Mentor Dashboard:
- ✅ "Teams by Group" tab available
- ✅ Group dropdown shows counts: "G1 (2 teams, 5 members)"
- ✅ Filtering works correctly
- ✅ Group badges visible on all team cards

### Database:
- ✅ Teams have `group` field populated
- ✅ Group validation works (only G1-G10 allowed)
- ✅ Group queries return correct results

## 🐛 Troubleshooting

### If team creation fails:
1. Check backend logs for validation errors
2. Ensure group field is being sent from frontend
3. Verify group is in allowed enum values

### If group filtering doesn't work:
1. Check network tab for API calls
2. Verify JWT token is valid
3. Check mentor role permissions

### If groups don't display:
1. Ensure teams exist in database
2. Check API response format
3. Verify frontend state management

## 🎉 Success Criteria

✅ Students can create teams with group selection
✅ Mentors can filter teams by group
✅ Group information is displayed throughout the UI
✅ API endpoints work correctly
✅ Role-based access control maintained
✅ JWT authentication still functional
